import fs from "node:fs";
import path from "node:path";
import solc from "solc";

const CONTRACTS_DIR = path.resolve(process.cwd(), "contracts");
const ARTIFACTS_DIR = path.resolve(process.cwd(), "contracts/artifacts");

const TARGET_CONTRACTS: Record<string, string> = {
  "MirroRegistry.sol": "MirroRegistry",
  "MirroVault.sol": "MirroVault",
  "MirroRelayer.sol": "MirroRelayer",
  "MockERC20.sol": "MockERC20",
};

async function compile() {
  console.log("==================================================");
  console.log("⚙️  Compiling mirro smart contracts with solc...");
  console.log("==================================================\n");

  if (!fs.existsSync(CONTRACTS_DIR)) {
    throw new Error(`Contracts directory not found at: ${CONTRACTS_DIR}`);
  }

  // Gather all .sol files
  const solFiles = fs.readdirSync(CONTRACTS_DIR).filter((f) => f.endsWith(".sol"));
  const sources: Record<string, { content: string }> = {};

  for (const file of solFiles) {
    const fullPath = path.join(CONTRACTS_DIR, file);
    sources[file] = {
      content: fs.readFileSync(fullPath, "utf8"),
    };
    console.log(`  Loaded source: ${file}`);
  }

  const input = {
    language: "Solidity",
    sources,
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      outputSelection: {
        "*": {
          "*": ["abi", "evm.bytecode.object"],
        },
      },
    },
  };

  function findImports(importPath: string) {
    let fullPath = importPath;
    if (importPath.startsWith("@openzeppelin/")) {
      fullPath = path.resolve(process.cwd(), "node_modules", importPath);
    } else if (!path.isAbsolute(importPath)) {
      fullPath = path.resolve(CONTRACTS_DIR, importPath);
    }
    if (fs.existsSync(fullPath)) {
      return { contents: fs.readFileSync(fullPath, "utf8") };
    }
    return { error: `File not found: ${importPath}` };
  }

  console.log("\nRunning Solidity compiler...");
  const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));

  if (output.errors) {
    let hasError = false;
    for (const error of output.errors) {
      if (error.severity === "error") {
        hasError = true;
        console.error(error.formattedMessage);
      } else {
        console.warn(error.formattedMessage);
      }
    }
    if (hasError) {
      throw new Error("Compilation failed with errors.");
    }
  }

  if (!fs.existsSync(ARTIFACTS_DIR)) {
    fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
  }

  console.log("\nWriting artifacts:");
  for (const [sourceFile, contractName] of Object.entries(TARGET_CONTRACTS)) {
    const contractData = output.contracts?.[sourceFile]?.[contractName];
    if (!contractData) {
      console.warn(`  ⚠️ Could not find compiled output for ${sourceFile}:${contractName}`);
      continue;
    }

    const artifact = {
      contractName,
      sourceFile,
      abi: contractData.abi,
      bytecode: "0x" + contractData.evm.bytecode.object,
    };

    const artifactPath = path.join(ARTIFACTS_DIR, `${contractName}.json`);
    fs.writeFileSync(artifactPath, JSON.stringify(artifact, null, 2), "utf8");

    const byteLen = (artifact.bytecode.length - 2) / 2;
    console.log(`  ✓ ${contractName.padEnd(16)} -> ${artifactPath}`);
    console.log(`    Bytecode: ${byteLen.toLocaleString()} bytes | ABI items: ${artifact.abi.length}`);
  }

  console.log("\n==================================================");
  console.log("✓ All mirro protocol contracts compiled successfully!");
  console.log("==================================================\n");
}

compile().catch((err) => {
  console.error("Compilation error:", err);
  process.exit(1);
});
