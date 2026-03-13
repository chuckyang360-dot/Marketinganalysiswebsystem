import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { useLanguage } from '../contexts/LanguageContext';

export function NotFound() {
  const { language } = useLanguage();

  return (
    <div className="min-h-screen pt-24 pb-12 px-6 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-4">
          {language === 'zh' ? '页面未找到' : 'Page Not Found'}
        </h2>
        <p className="text-gray-600 mb-8">
          {language === 'zh' 
            ? '抱歉，您访问的页面不存在。' 
            : 'Sorry, the page you are looking for does not exist.'}
        </p>
        <Link to="/">
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
            {language === 'zh' ? '返回首页' : 'Back to Home'}
          </Button>
        </Link>
      </div>
    </div>
  );
}
