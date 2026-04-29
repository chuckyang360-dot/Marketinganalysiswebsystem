import { Navbar } from '../../components/Navbar';

export function PlanPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="pt-20">
        <section className="mx-auto w-full max-w-[1280px] px-6 lg:px-10">
          <h1 className="text-3xl font-bold tracking-tight text-[#111111]">升级计划</h1>
          <div className="mt-6 min-h-[420px] rounded-2xl border border-[#EAEAEA] bg-white p-6" />
        </section>
      </main>
    </div>
  );
}
