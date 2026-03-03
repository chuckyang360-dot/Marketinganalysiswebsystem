import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { History as HistoryIcon, Trash2, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { toast } from 'sonner';

interface HistoryItem {
  id: number;
  type: string;
  data: any;
  result: any;
  timestamp: string;
}

export function History() {
  const { t } = useLanguage();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    const saved = localStorage.getItem('analysisHistory');
    if (saved) {
      setHistory(JSON.parse(saved));
    }
  };

  const handleDelete = (id: number) => {
    const updated = history.filter(item => item.id !== id);
    setHistory(updated);
    localStorage.setItem('analysisHistory', JSON.stringify(updated));
    toast.success('已删除');
  };

  const handleView = (item: HistoryItem) => {
    setSelectedItem(item);
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeColor = (type: string) => {
    const colors = {
      SEO: 'bg-blue-100 text-blue-700',
      Reddit: 'bg-orange-100 text-orange-700',
      Twitter: 'bg-sky-100 text-sky-700',
      Content: 'bg-purple-100 text-purple-700',
      Summary: 'bg-green-100 text-green-700',
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
              <HistoryIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">{t('history.title')}</h1>
              <p className="text-gray-600 mt-1">{t('history.description')}</p>
            </div>
          </div>
        </div>

        {/* History List */}
        {history.length === 0 ? (
          <Card className="p-12 text-center text-gray-500">
            <HistoryIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg">{t('history.empty')}</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {history.map((item) => (
              <Card key={item.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(item.type)}`}>
                      {item.type}
                    </span>
                    <div className="flex-1">
                      <div className="text-sm text-gray-600">{formatDate(item.timestamp)}</div>
                      <div className="text-sm text-gray-500 mt-1 line-clamp-1">
                        {JSON.stringify(item.data).substring(0, 100)}...
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleView(item)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      {t('history.view')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* View Dialog */}
        <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedItem?.type} - {selectedItem && formatDate(selectedItem.timestamp)}
              </DialogTitle>
            </DialogHeader>
            {selectedItem && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">输入数据</h3>
                  <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto">
                    {JSON.stringify(selectedItem.data, null, 2)}
                  </pre>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">分析结果</h3>
                  <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto">
                    {JSON.stringify(selectedItem.result, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
