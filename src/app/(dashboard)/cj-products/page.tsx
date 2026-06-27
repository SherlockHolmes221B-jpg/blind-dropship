import { verifySession } from "@/lib/dal"
import { CJProductImport } from "@/components/cj/product-import"

export default async function CJProductsPage() {
  await verifySession()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">CJ Dropshipping Products</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Browse CJ Dropshipping catalog and import products to your store
        </p>
      </div>
      <CJProductImport />
    </div>
  )
}
