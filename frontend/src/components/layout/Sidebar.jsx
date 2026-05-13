import { NavLink } from 'react-router-dom';
import { Dumbbell, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function Sidebar({ items, gymName, onClose, isMobile }) {
  return (
    <aside
      className={cn(
        'flex h-full w-64 flex-col border-r bg-card',
        isMobile ? 'fixed inset-y-0 left-0 z-50 shadow-2xl' : 'sticky top-0',
      )}
    >
      <div className="flex h-16 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Dumbbell className="h-4 w-4" />
          </div>
          <div>
            <div className="font-display text-sm font-bold leading-none">GymFlow</div>
            {gymName && (
              <div className="mt-0.5 text-[10px] text-muted-foreground line-clamp-1">{gymName}</div>
            )}
          </div>
        </div>
        {isMobile && onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={isMobile ? onClose : undefined}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span>{item.label}</span>
            {item.badge && (
              <span className="ml-auto rounded-full bg-primary/20 px-2 py-0.5 text-[10px] text-primary">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t p-3 text-[10px] text-muted-foreground">
        © {new Date().getFullYear()} GymFlow
      </div>
    </aside>
  );
}
