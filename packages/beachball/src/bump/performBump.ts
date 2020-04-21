import { unlinkChangeFiles } from '../changefile/unlinkChangeFiles';
import { writeChangelog } from '../changelog/writeChangelog';
import fs from 'fs-extra';
import { BumpInfo } from '../types/BumpInfo';
import { BeachballOptions } from '../types/BeachballOptions';
import { PackageDeps } from '../types/PackageInfo';

/**
 * Performs the bump, writes to the file system
 *
 * deletes change files, update package.json, and changelogs
 */
export async function performBump(bumpInfo: BumpInfo, options: BeachballOptions) {
  const { modifiedPackages, packageInfos, changes } = bumpInfo;

  for (const pkgName of modifiedPackages) {
    const info = packageInfos[pkgName];
    const packageJson = fs.readJSONSync(info.packageJsonPath);

    packageJson.version = info.version;

    ['dependencies', 'devDependencies', 'peerDependencies'].forEach(depKind => {
      const deps: PackageDeps | undefined = (info as any)[depKind];
      if (deps) {
        packageJson[depKind] = { ...packageJson[depKind], ...deps };
      }
    });

    fs.writeJSONSync(info.packageJsonPath, packageJson, { spaces: 2 });
  }

  // Generate changelog
  await writeChangelog(options, changes, packageInfos);

  // Unlink changelogs
  unlinkChangeFiles(changes, packageInfos, options.path);
}
