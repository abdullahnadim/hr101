// app/page.tsx
export default function HomePage() {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-neutral-50">
      <div className="h-16 w-16 bg-black rounded-2xl mb-6 mx-auto"></div>
      <h1 className="text-3xl font-bold text-neutral-900 mb-2">HR 101 Workspace</h1>
      <p className="text-neutral-500 max-w-md mx-auto">
        Select a module from the sidebar to manage recruitment, access the employee directory, or book facility resources.
      </p>
    </div>
  );
}