#!/usr/bin/env python3
import os
import sys
import argparse

def main():
    parser = argparse.ArgumentParser(description="Scaffold a new backend REST API module.")
    parser.add_argument("name", help="Name of the resource (e.g. Telemetry)")
    parser.add_argument("--dir", default="backend/src", help="Backend src directory path")

    args = parser.parse_args()

    resource_lower = args.name.lower()
    resource_capital = args.name.capitalize()

    workspace_root = os.getcwd()
    src_dir = os.path.join(workspace_root, args.dir)

    # File paths
    controller_path = os.path.join(src_dir, "controllers", f"{resource_lower}.controller.ts")
    route_path = os.path.join(src_dir, "routes", f"{resource_lower}.routes.ts")
    validator_path = os.path.join(src_dir, "validators", f"{resource_lower}.validator.ts")

    # Generate Validator
    validator_content = f"""import {{ z }} from 'zod';

export const create{resource_capital}Schema = z.object({{
  body: z.object({{
    name: z.string({{
      required_error: 'Name is required',
    }}),
    value: z.number({{
      required_error: 'Value is required',
    }}),
  }}),
}});
"""

    # Generate Controller
    controller_content = f"""import {{ Request, Response, NextFunction }} from 'express';
import {{ ApiResponse }} from '../utils/ApiResponse';
import {{ ApiError }} from '../utils/ApiError';

export const get{resource_capital}s = async (req: Request, res: Response, next: NextFunction) => {{
  try {{
    // Logic for listing items
    res.status(200).json(new ApiResponse(200, [], '{resource_capital}s retrieved successfully'));
  }} catch (error) {{
    next(error);
  }}
}};

export const create{resource_capital} = async (req: Request, res: Response, next: NextFunction) => {{
  try {{
    const {{ name, value }} = req.body;
    // Logic for creating item
    res.status(201).json(new ApiResponse(201, {{ name, value }}, '{resource_capital} created successfully'));
  }} catch (error) {{
    next(error);
  }}
}};
"""

    # Generate Route
    route_content = f"""import {{ Router }} from 'express';
import {{ get{resource_capital}s, create{resource_capital} }} from '../controllers/{resource_lower}.controller';
import {{ validate }} from '../middleware/validate.middleware';
import {{ create{resource_capital}Schema }} from '../validators/{resource_lower}.validator';
import {{ requireAuth }} from '../middleware/auth.middleware';

const router = Router();

router.route('/')
  .get(requireAuth, get{resource_capital}s)
  .post(requireAuth, validate(create{resource_capital}Schema), create{resource_capital});

export default router;
"""

    try:
        # Create directories if not exist
        os.makedirs(os.path.dirname(controller_path), exist_ok=True)
        os.makedirs(os.path.dirname(route_path), exist_ok=True)
        os.makedirs(os.path.dirname(validator_path), exist_ok=True)

        with open(validator_path, "w", encoding="utf-8") as f:
            f.write(validator_content)
        print(f"Created Validator: {os.path.relpath(validator_path, workspace_root)}")

        with open(controller_path, "w", encoding="utf-8") as f:
            f.write(controller_content)
        print(f"Created Controller: {os.path.relpath(controller_path, workspace_root)}")

        with open(route_path, "w", encoding="utf-8") as f:
            f.write(route_content)
        print(f"Created Route: {os.path.relpath(route_path, workspace_root)}")

    except Exception as e:
        print(f"Error scaffolding module files: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
