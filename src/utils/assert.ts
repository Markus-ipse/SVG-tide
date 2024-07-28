/**
 * Asserts that a value is truthy, throwing an error with a custom message if it is not.
 *
 * @param value - The value to be checked.
 * @param message - The custom error message to be thrown if the value is falsy. Defaults to "Value is required to be truthy".
 * @throws {Error} - Throws an error with the custom message if the value is falsy.
 */
export function assertOk(
  value: unknown,
  message = "Value is required to be truthy"
): asserts value {
  if (!value) {
    throw new Error(message);
  }
}

export function assertNever(x: never): never {
  throw new Error(`Unhandled case: ${x}`);
}
