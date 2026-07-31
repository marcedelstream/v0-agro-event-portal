"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createBrowserClient } from "@/lib/supabase/client"

interface Organization {
  id: string
  name: string
  slug: string
  avatar_url: string | null
}

export function OrganizationsRow() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadOrganizations() {
      const supabase = createBrowserClient()
      const { data } = await supabase
        .from("organizations")
        .select("id, name, slug, avatar_url")
        .eq("is_active", true)
        .order("name")

      setOrganizations(data || [])
      setLoading(false)
    }
    loadOrganizations()
  }, [])

  if (loading || organizations.length === 0) return null

  return (
    <div>
      <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Convenios</h3>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {organizations.map((org) => (
          <Link
            key={org.id}
            href={`/organizador/${org.slug}`}
            className="flex flex-col items-center gap-2 shrink-0 text-center"
            style={{ flex: "0 0 calc(25% - 9px)" }}
          >
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-border bg-muted flex items-center justify-center">
              {org.avatar_url ? (
                <img src={org.avatar_url} alt={org.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-muted-foreground">{org.name.charAt(0)}</span>
              )}
            </div>
            <span className="text-xs font-semibold leading-tight w-full break-words line-clamp-2">{org.name}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
