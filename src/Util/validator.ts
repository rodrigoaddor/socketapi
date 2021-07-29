type HasValidator<T> = { valid: false; missing: (keyof T)[] } | ({ valid: true } & T);

export const has = <T>(keys: (keyof T)[]) => {
  return (data: Partial<T>): HasValidator<T> => {
    const objKeys = Object.keys(data) as (keyof T)[];
    const missing = keys.filter((key) => !objKeys.includes(key));

    return missing.length > 0 ? { valid: false, missing } : { valid: true, ...data };
  };
};
