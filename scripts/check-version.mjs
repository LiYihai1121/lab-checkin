import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const root = fileURLToPath(new URL('..', import.meta.url))
const packages = ['server', 'web']
const semverPattern = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/

const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'))

const manifests = await Promise.all(packages.map(async (name) => {
  const packageJson = await readJson(resolve(root, name, 'package.json'))
  const lockfile = await readJson(resolve(root, name, 'package-lock.json'))
  return { name, packageJson, lockfile }
}))

const versions = new Set()
const errors = []

for (const { name, packageJson, lockfile } of manifests) {
  const packageVersion = packageJson.version
  const lockVersion = lockfile.packages?.['']?.version

  if (!semverPattern.test(packageVersion ?? '')) {
    errors.push(`${name}/package.json version is not valid SemVer: ${packageVersion}`)
  }
  if (packageVersion !== lockVersion) {
    errors.push(`${name} package.json and package-lock.json versions differ`)
  }

  versions.add(packageVersion)
}

if (versions.size !== 1) {
  errors.push('server and web must use the same product version')
}

if (errors.length > 0) {
  console.error(errors.join('\n'))
  process.exitCode = 1
} else {
  console.log(`Version check passed: ${[...versions][0]}`)
}