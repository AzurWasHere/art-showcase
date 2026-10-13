"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { revalidateGalleryAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";

export function RevalidateButton() {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      className="rounded-full"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await revalidateGalleryAction();
          if (result.ok) toast.success(result.message);
          else toast.error(result.message);
        })
      }
    >
      {pending ? <Loader2 className="animate-spin" /> : <RefreshCw />}
      Refresh cache
    </Button>
  );
}
