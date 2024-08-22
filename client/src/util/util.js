export function truncateName(name, maxLength) {
  if (name.length > maxLength) {
    return name.slice(0, maxLength);
  }
  return name;
}
