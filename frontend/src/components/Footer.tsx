import { Link } from 'react-router-dom';
import { BarChart3, FileText, LayoutDashboard, Lightbulb, Globe, Book, HelpCircle, Mail, MapPin } from 'lucide-react';

export function Footer() {

  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="container mx-auto px-6 py-16">
        <div className="mb-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <FooterColumn
            title="产品"
            links={[
              { label: '市场分析', icon: <BarChart3 className="h-4 w-4" />, href: '/product' },
              { label: '内容机会', icon: <Lightbulb className="h-4 w-4" />, href: '#' },
              { label: '内容创意', icon: <FileText className="h-4 w-4" />, href: '#' },
              { label: '工作台', icon: <LayoutDashboard className="h-4 w-4" />, href: '/workspace' },
            ]}
          />
          <FooterColumn
            title="资源"
            links={[
              { label: '案例展示', icon: <FileText className="h-4 w-4" />, href: '/cases' },
              { label: '支持中心', icon: <HelpCircle className="h-4 w-4" />, href: '#' },
              { label: '使用指南', icon: <Book className="h-4 w-4" />, href: '#' },
              { label: '常见问题', icon: <HelpCircle className="h-4 w-4" />, href: '#' },
            ]}
          />
          <FooterColumn
            title="公司"
            links={[
              { label: '关于我们', icon: <Lightbulb className="h-4 w-4" />, href: '/about' },
              { label: '公司介绍', icon: <Globe className="h-4 w-4" />, href: '#' },
              { label: '联系合作', icon: <Mail className="h-4 w-4" />, href: '#' },
              { label: '隐私政策', icon: <Globe className="h-4 w-4" />, href: '#' },
            ]}
          />
          <ContactColumn />
        </div>

        <div className="border-t border-gray-200 flex flex-col items-center justify-between gap-4 pt-8 md:flex-row">
          <p className="text-sm text-gray-500">© 2026 GlobalPulse AI. All rights reserved.</p>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <Link to="/" className="hover:text-gray-900">首页</Link>
            <Link to="/about" className="hover:text-gray-900">服务</Link>
            <Link to="#" className="hover:text-gray-900">信息</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

interface FooterColumnProps {
  title: string;
  links: { label: string; icon: React.ReactNode; href: string }[];
}

function FooterColumn({ title, links }: FooterColumnProps) {
  return (
    <div>
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-900">
        {title}
      </h3>
      <ul className="space-y-3">
        {links.map((link, idx) => (
          <li key={idx}>
            <Link
              to={link.href}
              className="flex items-center gap-2 text-sm text-gray-600 transition-colors hover:text-gray-900"
            >
              {link.icon}
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ContactColumn() {
  return (
    <div>
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-900">
        联系方式
      </h3>
      <ul className="space-y-3">
        <li className="flex items-center gap-2 text-sm text-gray-600">
          <Mail className="h-4 w-4" />
          <span>联系人：杨克</span>
        </li>
        <li className="flex items-center gap-2 text-sm text-gray-600">
          <Mail className="h-4 w-4" />
          <span>邮箱：chuckyang360@gmail.com</span>
        </li>
        <li className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="h-4 w-4" />
          <span>公司：杭州越响信息科技有限公司</span>
        </li>
      </ul>
    </div>
  );
}
