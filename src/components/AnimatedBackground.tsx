// Minimal mono-glass animated backdrop
export const AnimatedBackground = () => {
  return (
    <>
      <div className="fixed inset-0 -z-20 bg-background" />
      <div className="bg-orbs" aria-hidden="true" />
    </>
  );
};
