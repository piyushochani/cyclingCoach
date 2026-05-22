const stats = [
  { label: "Active Athletes", value: "10,000+" },
  { label: "Training Plans Generated", value: "50,000+" },
  { label: "AI-Powered Insights", value: "1M+" },
  { label: "Avg. Performance Gain", value: "23%" },
];

const StatsBanner = () => {
  return (
    <section className="border-y border-white/10 bg-black py-14">
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map(({ label, value }) => (
            <div key={label} className="text-center">
              <p className="font-barlowCondensed text-3xl text-[#FF6B00] md:text-4xl">{value}</p>
              <p className="mt-2 font-dmSans text-xs uppercase tracking-[0.12em] text-white/50">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsBanner;
