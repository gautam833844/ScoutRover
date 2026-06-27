#!/usr/bin/env python3
import os
import sys
import re
import argparse

def profile_file(filepath):
    filename = os.path.basename(filepath)
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    has_timestamps = "timestamps: true" in content or "timestamps:" in content
    has_index = "index: true" in content or "unique: true" in content or ".index(" in content
    has_relations = "ref:" in content or "Schema.Types.ObjectId" in content

    # Perform basic check
    findings = []
    if not has_timestamps:
        findings.append("Missing automatic timestamps configuration (`timestamps: true`)")
    if not has_index:
        findings.append("No explicit indexes or unique constraints found")
    
    return {
        "file": filename,
        "timestamps": has_timestamps,
        "indexed": has_index,
        "relations": has_relations,
        "findings": findings
    }

def main():
    parser = argparse.ArgumentParser(description="Profile Mongoose models for design standards.")
    parser.add_argument("models_dir", nargs="?", default="backend/src/models", help="Directory containing Mongoose schemas")

    args = parser.parse_args()

    workspace_root = os.getcwd()
    target_dir = os.path.join(workspace_root, args.models_dir)

    if not os.path.exists(target_dir):
        print(f"Directory not found: {target_dir}", file=sys.stderr)
        sys.exit(1)

    print(f"### Profiling models in directory: `{args.models_dir}`\n")

    files = [f for f in os.listdir(target_dir) if f.endswith(".ts") and not f.endswith(".test.ts")]
    
    if not files:
        print("No typescript model files found.")
        return

    all_findings_count = 0
    for filename in files:
        filepath = os.path.join(target_dir, filename)
        result = profile_file(filepath)
        
        status = "✅ CLEAN" if not result["findings"] else "⚠️ ISSUES FOUND"
        print(f"#### Model: `{result['file']}` [{status}]")
        print(f"- Timestamps enabled: {'Yes' if result['timestamps'] else 'No'}")
        print(f"- Index definitions: {'Yes' if result['indexed'] else 'No'}")
        print(f"- Has Relations/Refs: {'Yes' if result['relations'] else 'No'}")
        if result["findings"]:
            for issue in result["findings"]:
                print(f"  - [Smell]: {issue}")
                all_findings_count += 1
        print()

    print(f"Profile complete. Total issues detected: {all_findings_count}")

if __name__ == "__main__":
    main()
