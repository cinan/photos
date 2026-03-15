import projects from './projects.js';

export default function() {
  const allProjects = projects();
  const photos = [];

  for (const project of allProjects) {
    const total = project.images.length;
    for (let i = 0; i < total; i++) {
      const image = project.images[i];
      photos.push({
        projectSlug: project.slug,
        projectTitle: project.title,
        image: image.name,
        slug: image.slug,
        index: i + 1,
        total,
        src: `projects/${project.slug}/${image.name}`,
      });
    }
  }

  return photos;
}
