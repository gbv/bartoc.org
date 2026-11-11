// Create the minimal JSKOS media shape for one image URL.
export function imageMedia(id) {
  return {
    type: "Manifest",
    items: [],
    thumbnail: [{ type: "Image", id }],
  }
}
