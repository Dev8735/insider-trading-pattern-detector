import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

export default function TrendsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <Header />

      <main className="md:ml-60 pt-16 pb-8">
        <div className="container-md">
          <h1 className="text-3xl font-bold mb-4">Trends</h1>
          <div className="card">
            <p className="text-muted">Market trend analysis coming soon...</p>
          </div>
        </div>
      </main>
    </div>
  );
}
