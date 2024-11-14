function shortAddress(address) {
  const shortedAddress = address
    .slice(0, 8)
    .concat("...")
    .concat(address.slice(-8));

  return shortedAddress;
}

export { shortAddress };
