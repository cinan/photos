import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default function() {
  const projectsDir = path.join(__dirname, '../projects');
  if (!fs.existsSync(projectsDir)) return [];

  return fs.readdirSync(projectsDir, { withFileTypes: true })
    .filter(d => d.isDirectory() && !d.name.startsWith('.'))
    .sort((a, b) => b.name.localeCompare(a.name))
    .map(d => {
      const projectDir = path.join(projectsDir, d.name);
      const images = fs.readdirSync(projectDir)
        .filter(f => /\.(tiff?|jpg|jpeg|png|webp|avif)$/i.test(f))
        .sort()
        .reverse()
        .map(name => ({ name, slug: name.replace(/\.[^.]+$/, '') }));

      // Optional per-project metadata
      let meta = {};
      const metaPath = path.join(projectDir, 'meta.yaml');
      if (fs.existsSync(metaPath)) {
        meta = yaml.load(fs.readFileSync(metaPath, 'utf8')) || {};
      }

      return {
        slug: d.name,
        title: meta.title || d.name.charAt(0).toUpperCase() + d.name.slice(1).replace(/[-_]/g, ' '),
        description: meta.description || '',
        year: meta.year || '',
        cover: images[0] || null,
        images,
      };
    });
}
