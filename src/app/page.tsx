
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

type TxType = "income" | "expense";

type Transaction = {
  id: string;
  created_at: string;
  title: string;
  amount: number;
  type: TxType;
  category: string | null;
  tx_date: string;
};

export default function Home() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<TxType>("expense");
  const [category, setCategory] = useState("");
  const [items, setItems] = useState<Transaction[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  const totals = items.reduce(
    (summary, item) => {
      if (item.type === "income") {
        summary.income += item.amount;
      } else {
        summary.expenses += item.amount;
      }

      return summary;
    },
    { income: 0, expenses: 0 }
  );
  const balance = totals.income - totals.expenses;

  async function load(currentUserId: string | null = userId) {
    if (!currentUserId) {
      router.push("/login");
      return;
    }

    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", currentUserId)
      .order("tx_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (!error) setItems(data || []);
    else alert(error.message);
  }

  useEffect(() => {
    let isMounted = true;

    async function initializePage() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (!isMounted) {
        return;
      }

      if (error) {
        alert(error.message);
        setCheckingSession(false);
        return;
      }

      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);
      const { data, error: loadError } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("tx_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (!isMounted) {
        return;
      }

      if (loadError) {
        alert(loadError.message);
      } else {
        setItems(data || []);
      }

      if (isMounted) {
        setCheckingSession(false);
      }
    }

    void initializePage();

    return () => {
      isMounted = false;
    };
  }, [router]);

  async function addTx(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!title.trim() || !amount || !userId) return;

    const { error } = await supabase.from("transactions").insert({
      title: title.trim(),
      amount: Number(amount),
      type,
      category: category.trim() || null,
      user_id: userId,
    });

    if (error) return alert(error.message);

    setTitle("");
    setAmount("");
    setCategory("");
    setType("expense");
    load();
  }

  async function removeTx(id: string) {
    if (!userId) {
      router.push("/login");
      return;
    }

    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);
    if (error) return alert(error.message);
    load();
  }

  function formatCurrency(value: number) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(value);
  }

  function formatDate(value: string) {
    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(parsed);
  }

  if (checkingSession) {
    return (
      <main className="app-shell flex items-center justify-center">
        <div className="panel max-w-lg p-8 text-center">
          <p className="eyebrow">Checking session</p>
          <h1 className="section-title mt-4">Loading your tracker</h1>
          <p className="muted-copy mt-3">Confirming your account before loading transactions.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <section className="app-grid lg:grid-cols-[1.4fr_0.95fr]">
        <div className="panel hero-panel">
          <span className="eyebrow">Personal finance snapshot</span>
          <div className="mt-5 max-w-2xl">
            <h1 className="display-title">A cleaner budget view for everyday spending.</h1>
            <p className="muted-copy mt-4 max-w-xl text-base leading-7 sm:text-lg">
              Track what came in, what went out, and what is still safe to spend in one
              calm workspace.
            </p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <article className="stat-card">
              <p className="stat-label">Current balance</p>
              <p className="stat-value">{formatCurrency(balance)}</p>
            </article>
            <article className="stat-card">
              <p className="stat-label">Income</p>
              <p className="stat-value text-[var(--primary)]">{formatCurrency(totals.income)}</p>
            </article>
            <article className="stat-card">
              <p className="stat-label">Expenses</p>
              <p className="stat-value text-[#8a6626]">{formatCurrency(totals.expenses)}</p>
            </article>
          </div>
        </div>

        <aside className="panel p-6 sm:p-7">
          <p className="eyebrow">Session controls</p>
          <h2 className="section-title mt-4">Your tracker is now tied to your account.</h2>
          <p className="muted-copy mt-3 leading-7">
            Transactions are loaded only for the signed-in user and protected by your
            Supabase policies.
          </p>
          <div className="mt-6 grid gap-3">
            <Link href="/dashboard" className="button-primary">
              Open dashboard
            </Link>
            <Link href="/login" className="button-secondary">
              Sign in
            </Link>
          </div>

          <div className="mt-6 rounded-2xl bg-[var(--surface-soft)] px-4 py-4">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
              Access model
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">
              Sign in first, then add transactions that belong only to your account.
            </p>
          </div>
        </aside>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.35fr]">
        <div className="panel p-6 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow">Add a transaction</p>
              <h2 className="section-title mt-4">Log a new expense or income entry.</h2>
            </div>
          </div>

          <form onSubmit={addTx} className="mt-6 grid gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-semibold text-[var(--foreground)]" htmlFor="title">
                Title
              </label>
              <input
                id="title"
                placeholder="Groceries, paycheck, rent"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-[var(--foreground)]" htmlFor="amount">
                  Amount
                </label>
                <input
                  id="amount"
                  placeholder="0.00"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-semibold text-[var(--foreground)]" htmlFor="type">
                  Type
                </label>
                <select
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value as TxType)}
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-semibold text-[var(--foreground)]" htmlFor="category">
                Category
              </label>
              <input
                id="category"
                placeholder="Food, bills, work, travel"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>

            <button type="submit" className="button-primary mt-2">
              Add transaction
            </button>
          </form>
        </div>

        <div className="panel p-6 sm:p-7">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Transaction history</p>
              <h2 className="section-title mt-4">Recent activity</h2>
            </div>
            <div className="rounded-full bg-[var(--surface-soft)] px-4 py-2 text-sm font-semibold text-[var(--muted)]">
              {items.length} {items.length === 1 ? "entry" : "entries"}
            </div>
          </div>

          <div className="mt-6 grid gap-3">
            {items.length === 0 ? (
              <div className="empty-state">
                <h3 className="section-title text-[1.3rem]">No transactions yet</h3>
                <p className="muted-copy mt-2 text-sm leading-6 sm:text-base">
                  Add your first entry to start building a clearer picture of your budget.
                </p>
              </div>
            ) : (
              items.map((item) => (
                <article key={item.id} className="transaction-row">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-lg font-bold text-[var(--foreground)]">
                        {item.title}
                      </h3>
                      <span
                        className={`type-chip ${
                          item.type === "income" ? "type-chip-income" : "type-chip-expense"
                        }`}
                      >
                        {item.type}
                      </span>
                    </div>
                    <p className="muted-copy mt-2 text-sm leading-6">
                      {item.category ? `${item.category} • ` : ""}
                      {formatDate(item.tx_date)}
                    </p>
                  </div>

                  <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
                    <div className="text-right">
                      <p
                        className={`text-xl font-extrabold ${
                          item.type === "income" ? "text-[var(--primary)]" : "text-[#8a6626]"
                        }`}
                      >
                        {item.type === "income" ? "+" : "-"}
                        {formatCurrency(item.amount)}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="button-secondary"
                      onClick={() => removeTx(item.id)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
