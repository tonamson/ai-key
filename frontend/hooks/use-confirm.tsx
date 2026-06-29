'use client';

import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertTriangle } from 'lucide-react';

interface ConfirmOptions {
  title?: string;
  description: string;
  confirmLabel?: string;
  variant?: 'default' | 'destructive';
}

export function useConfirm() {
  const [open, setOpen] = useState(false);
  const [opts, setOpts] = useState<ConfirmOptions>({ description: '' });
  const resolveRef = useRef<(v: boolean) => void>(() => {});

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    setOpts(options);
    setOpen(true);
    return new Promise(res => { resolveRef.current = res; });
  }, []);

  function resolve(v: boolean) {
    setOpen(false);
    resolveRef.current(v);
  }

  const ConfirmDialog = (
    <Dialog open={open} onOpenChange={o => !o && resolve(false)}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-amber-500 shrink-0" />
            {opts.title ?? 'Xác nhận'}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground whitespace-pre-line">{opts.description}</p>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => resolve(false)}>Huỷ</Button>
          <Button variant={opts.variant ?? 'destructive'} onClick={() => resolve(true)}>
            {opts.confirmLabel ?? 'Xác nhận'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return { confirm, ConfirmDialog };
}
