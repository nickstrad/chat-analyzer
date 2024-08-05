export default async function DashboardContainer({
  children,
}: {
  children: JSX.Element;
}) {
  return (
    <>
      <div className="flex w-full">
        <div className="card bg-base-300 rounded-box grid h-20 flex-grow place-items-center">
          left
        </div>
        <div className="divider divider-horizontal">OR</div>
        {children}
      </div>
    </>
  );
}
