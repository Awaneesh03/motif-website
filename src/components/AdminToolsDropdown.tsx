import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Wrench, TrendingUp, BookOpen, Users, Shield } from 'lucide-react';

import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';

export const AdminToolsDropdown = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const tools = [
    {
      to: '/idea-analyser',
      label: 'Idea Analyser',
      icon: TrendingUp,
      active: location.pathname === '/idea-analyser',
    },
    {
      to: '/pitch-creator',
      label: 'Pitch Creator',
      icon: BookOpen,
      active: location.pathname === '/pitch-creator',
    },
    {
      to: '/community',
      label: 'Community',
      icon: Users,
      active: location.pathname === '/community',
    },
    {
      to: '/profile',
      label: 'Profile',
      icon: Shield,
      active: location.pathname === '/profile',
    },
  ];

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 px-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
        >
          <Wrench className="h-4 w-4 mr-2" />
          Tools
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {tools.map((tool, index) => (
          <div key={tool.to}>
            {index > 0 && <DropdownMenuSeparator />}
            <DropdownMenuItem asChild>
              <Link
                to={tool.to}
                className={`flex items-center gap-2 px-2 py-2 text-sm ${
                  tool.active
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setIsOpen(false)}
              >
                <tool.icon className="h-4 w-4" />
                {tool.label}
              </Link>
            </DropdownMenuItem>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
