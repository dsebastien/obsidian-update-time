interface Named {
  name: string;
}

export const hasName = (obj: unknown): obj is Named => {
  return (
    (obj as Named)?.name !== undefined &&
    'string' === typeof (obj as Named).name
  );
};
