import { readFile, copyFile, mkdir, rm, writeFile } from 'node:fs/promises'
import * as simpleIcons from 'simple-icons'
const encoding = 'utf8'
const srcPathMdi = './node_modules/@mdi/svg'
const srcPathSimpleIcons = './node_modules/simple-icons'
const destPath = './public/icons';
(async () => {
  try {
    console.log(`removing previous icons in ${destPath}`)
    await rm(destPath, { recursive: true })
  } catch (error) {
    console.warn(error.message)
  }
  console.log(`creating folder ${destPath}`)
  await mkdir(destPath)
  const iconNames = []

  // Material Design Icons
  console.log('creating Material Design Icons')
  const meta = JSON.parse(await readFile(`${srcPathMdi}/meta.json`, { encoding }))
  for (const icon of meta) {
    try {
      await copyFile(`${srcPathMdi}/svg/${icon.name}.svg`, `${destPath}/${icon.name}.svg`)
      iconNames.push(icon.name)
    } catch (error) {
      console.error(error.message, icon.name)
    }
  }

  // Simple Icons
  console.log('creating Simple Icons')
  for (const icon in simpleIcons) {
    try {
      const slug = simpleIcons[icon].slug
      if (simpleIcons[icon].hex) {
        let svg = await readFile(`${srcPathSimpleIcons}/icons/${slug}.svg`, { encoding })
        svg = svg
          .replace('<path ', `<path color="#${simpleIcons[icon].hex}" fill="currentColor" `)
          .replace(/<title>.*<\/title>/, '')
        await writeFile(`${destPath}/${slug}.svg`, svg, { encoding })
      } else {
        await copyFile(`${srcPathSimpleIcons}/icons/${slug}.svg`, `${destPath}/${slug}.svg`)
      }
      iconNames.push(slug)
    } catch (error) {
      console.error(error.message, icon.title)
    }
  }
  await writeFile(`${destPath}-list.json`, JSON.stringify(iconNames), { encoding })

})()
