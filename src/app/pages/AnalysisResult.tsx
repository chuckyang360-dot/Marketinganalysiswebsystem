import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { ArrowLeft, Download, Share2 } from 'lucide-react';

export function AnalysisResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state?.result;

  if (!result) {
    navigate('/workspace');
    return null;
  }

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate('/workspace')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Workspace
          </Button>
        </div>

        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Analysis Result</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        <Card className="p-8">
          <pre className="whitespace-pre-wrap text-sm text-gray-700">
            {JSON.stringify(result, null, 2)}
          </pre>
        </Card>
      </div>
    </div>
  );
}
