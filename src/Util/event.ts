export const parseArgs = (args: any[]): [Record<string, any>, Function] => {
  let data = {};
  let callback = () => {};

  if (typeof args[0] === 'object' && args[0] !== null) {
    data = args[0];
  }

  if (typeof args[args.length - 1] === 'function') {
    callback = args[args.length - 1];
  }

  return [data, callback];
};
