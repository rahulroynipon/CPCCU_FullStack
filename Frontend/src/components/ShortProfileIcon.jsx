export default function ShortProfileIcon({ data }) {
  return (
    <main>
      <section className="flex items-center justify-center gap-1">
        <div className="h-8 w-8 rounded-full overflow-hidden bg-red-400">
          <img src={data?.avatar} alt="" />
        </div>
        <h3 className="font-semibold">{data?.username}</h3>
      </section>
    </main>
  );
}
