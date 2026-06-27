#!/usr/bin/env python3
import os
import sys
import argparse

def main():
    parser = argparse.ArgumentParser(description="Scaffold a new backend integration test using Jest and Supertest.")
    parser.add_argument("name", help="Name of the resource/test suite (e.g. Telemetry)")
    parser.add_argument("--route", required=True, help="API route path to test (e.g. /api/v1/telemetry)")
    parser.add_argument("--outdir", default="backend/src/tests", help="Target test output directory")

    args = parser.parse_args()

    resource_lower = args.name.lower()
    resource_capital = args.name.capitalize()

    workspace_root = os.getcwd()
    target_dir = os.path.join(workspace_root, args.outdir)

    try:
        os.makedirs(target_dir, exist_ok=True)
    except Exception as e:
        print(f"Error creating directory: {e}", file=sys.stderr)
        sys.exit(1)

    test_file = os.path.join(target_dir, f"{resource_lower}.test.ts")

    test_content = f"""import request from 'supertest';
import app from '../app';
import {{ connectDB, disconnectDB, clearDB }} from './helpers/database';

describe('{resource_capital} API Endpoints', () => {{
  beforeAll(async () => {{
    await connectDB();
  }});

  afterAll(async () => {{
    await disconnectDB();
  }});

  beforeEach(async () => {{
    await clearDB();
  }});

  describe('GET {args.route}', () => {{
    it('should return 401 if request is unauthorized', async () => {{
      const res = await request(app)
        .get('{args.route}')
        .expect(401);
      
      expect(res.body.success).toBe(false);
    }});
  }});

  describe('POST {args.route}', () => {{
    it('should validate inputs and reject malformed body', async () => {{
      const res = await request(app)
        .post('{args.route}')
        .send({{}})
        .expect(400);

      expect(res.body.success).toBe(false);
    }});
  }});
}});
"""

    try:
        with open(test_file, "w", encoding="utf-8") as f:
            f.write(test_content)
        print(f"Created integration test template: {os.path.relpath(test_file, workspace_root)}")
    except Exception as e:
        print(f"Error writing test file: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
