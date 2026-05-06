"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

type TxType = "income" | "expense";
type RecurrenceFrequency = "none" | "weekly" | "monthly";

type Transaction = {
  id: string;
  created_at: string;
  title: string;
  amount: number;
  type: TxType;
  category: string | null;
  tx_date: string;
};

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function shiftRecurringDate(baseDate: string, frequency: Exclude<RecurrenceFrequency, "none">, step: number) {
  const nextDate = new Date(`${baseDate}T12:00:00`);

  if (frequency === "weekly") {
    nextDate.setDate(nextDate.getDate() + 7 * step);
  } else {
    nextDate.setMonth(nextDate.getMonth() + step);
  }

  return nextDate.toISOString().slice(0, 10);
}

function getRecurringDates(
  baseDate: string,
  frequency: RecurrenceFrequency,
  occurrences: number
) {
  if (frequency === "none") {
    return [baseDate];
  }

  return Array.from({ length: occurrences }, (_, index) =>
    shiftRecurringDate(baseDate, frequency, index)
  );
}

export default function Home() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<TxType>("expense");
  const [category, setCategory] = useState("");
  const [txDate, setTxDate] = useState(getTodayDate());
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<RecurrenceFrequency>("none");
  const [recurrenceCount, setRecurrenceCount] = useState("3");
  const [editingId, setEditingId] = useState<string | null>(null);
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
  const isAuthenticated = Boolean(userId);
  const isEditing = Boolean(editingId);

  function resetForm() {
    setTitle("");
    setAmount("");
    setCategory("");
    setType("expense");
    setTxDate(getTodayDate());
    setRecurrenceFrequency("none");
    setRecurrenceCount("3");
    setEditingId(null);
  }

  async function load(currentUserId: string | null = userId) {
    if (!currentUserId) {
      return;
    }

    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", currentUserId)
      .order("tx_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (!error) {
      setItems(data || []);
    } else {
      alert(error.message);
    }
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
        setUserId(null);
        setItems([]);
        setCheckingSession(false);
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

      setCheckingSession(false);
    }

    void initializePage();

    return () => {
      isMounted = false;
    };
  }, []);

  async function saveTransaction(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!title.trim() || !amount || !txDate || !userId) {
      router.push("/login");
      return;
    }

    const parsedAmount = Number(amount);

    if (Number.isNaN(parsedAmount)) {
      alert("Enter a valid amount before saving.");
      return;
    }

    if (isEditing && editingId) {
      const { error } = await supabase
        .from("transactions")
        .update({
          title: title.trim(),
          amount: parsedAmount,
          type,
          category: category.trim() || null,
          tx_date: txDate,
        })
        .eq("id", editingId)
        .eq("user_id", userId);

      if (error) {
        alert(error.message);
        return;
      }

      resetForm();
      await load();
      return;
    }

    const occurrences =
      recurrenceFrequency === "none"
        ? 1
        : Math.max(1, Math.min(Number(recurrenceCount) || 1, recurrenceFrequency === "weekly" ? 12 : 24));

    const rows = getRecurringDates(txDate, recurrenceFrequency, occurrences).map((dateValue) => ({
      title: title.trim(),
      amount: parsedAmount,
      type,
      category: category.trim() || null,
      tx_date: dateValue,
      user_id: userId,
    }));

    const { error } = await supabase.from("transactions").insert(rows);

    if (error) {
      alert(error.message);
      return;
    }

    resetForm();
    await load();
  }

  function startEditing(item: Transaction) {
    setEditingId(item.id);
    setTitle(item.title);
    setAmount(String(item.amount));
    setType(item.type);
    setCategory(item.category ?? "");
    setTxDate(item.tx_date);
    setRecurrenceFrequency("none");
    setRecurrenceCount("3");
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

    if (error) {
      alert(error.message);
      return;
    }

    if (editingId === id) {
      resetForm();
    }

    await load();
  }

  function formatCurrency(value: number) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(value);
  }

  function formatDate(value: string) {
    const parsed = new Date(`${value}T12:00:00`);

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

  if (!isAuthenticated) {
    return (
      <main className="app-shell">
        <section className="app-grid lg:grid-cols-[1.35fr_0.95fr]">
          <div className="panel hero-panel">
            <span className="eyebrow">Welcome to StashUp</span>
            <div className="mt-5 max-w-2xl">
              <h1 className="display-title">Build a calmer view of your money.</h1>
              <p className="muted-copy mt-4 max-w-xl text-base leading-7 sm:text-lg">
                Track spending, review income, edit entries, and plan recurring transactions in one
                focused budget workspace.
              </p>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <article className="stat-card">
                <p className="stat-label">Track</p>
                <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">
                  Add income and expenses with categories and dates.
                </p>
              </article>
              <article className="stat-card">
                <p className="stat-label">Repeat</p>
                <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">
                  Create weekly or monthly recurring transactions.
                </p>
              </article>
              <article className="stat-card">
                <p className="stat-label">Adjust</p>
                <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">
                  Edit existing entries whenever your plan changes.
                </p>
              </article>
            </div>
          </div>

          <aside className="panel p-6 sm:p-7">
            <p className="eyebrow">Get started</p>
            <h2 className="section-title mt-4">Create an account or jump back in.</h2>
            <p className="muted-copy mt-3 leading-7">
              Sign up to create your personal budget space, or log in if you already have an
              account.
            </p>

            <div className="mt-6 grid gap-3">
              <Link href="/signup" className="button-primary">
                Sign up
              </Link>
              <Link href="/login" className="button-secondary">
                Log in
              </Link>
            </div>

            <div className="mt-6 rounded-2xl bg-[var(--surface-soft)] px-4 py-4">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                What happens next
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">
                After you sign in, this page becomes your budget tracker and the top navigation
                switches to a single Log out action.
              </p>
            </div>
          </aside>
        </section>
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
          <p className="eyebrow">{isAuthenticated ? "Session controls" : "Get started"}</p>
          <h2 className="section-title mt-4">
            {isAuthenticated
              ? "Your tracker is now tied to your account."
              : "Create an account or log in to start tracking."}
          </h2>
          <p className="muted-copy mt-3 leading-7">
            {isAuthenticated
              ? "Transactions are loaded only for the signed-in user and protected by your Supabase policies."
              : "Sign up for your own workspace, then log in to add transactions and keep your budget in one place."}
          </p>
          <div className="mt-6 grid gap-3">
            <Link href="/dashboard" className="button-primary">
              Open dashboard
            </Link>
          </div>

          <div className="mt-6 rounded-2xl bg-[var(--surface-soft)] px-4 py-4">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
              Access model
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">
              Your transactions belong only to your signed-in account.
            </p>
          </div>
        </aside>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.35fr]">
        <div className="panel p-6 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow">{isEditing ? "Edit transaction" : "Add a transaction"}</p>
              <h2 className="section-title mt-4">
                {isEditing
                  ? "Update this entry and save your changes."
                  : "Log a new expense or income entry."}
              </h2>
            </div>
          </div>

          <form onSubmit={saveTransaction} className="mt-6 grid gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-semibold text-[var(--foreground)]" htmlFor="title">
                Title
              </label>
              <input
                id="title"
                disabled={!isAuthenticated}
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
                  disabled={!isAuthenticated}
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
                  disabled={!isAuthenticated}
                  value={type}
                  onChange={(e) => setType(e.target.value as TxType)}
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-[var(--foreground)]" htmlFor="category">
                  Category
                </label>
                <input
                  id="category"
                  disabled={!isAuthenticated}
                  placeholder="Food, bills, work, travel"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-semibold text-[var(--foreground)]" htmlFor="tx-date">
                  Date
                </label>
                <input
                  id="tx-date"
                  type="date"
                  disabled={!isAuthenticated}
                  value={txDate}
                  onChange={(e) => setTxDate(e.target.value)}
                />
              </div>
            </div>

            {!isEditing ? (
              <div className="grid gap-4 sm:grid-cols-[1fr_0.8fr]">
                <div className="grid gap-2">
                  <label
                    className="text-sm font-semibold text-[var(--foreground)]"
                    htmlFor="recurrence-frequency"
                  >
                    Repeat
                  </label>
                  <select
                    id="recurrence-frequency"
                    disabled={!isAuthenticated}
                    value={recurrenceFrequency}
                    onChange={(e) => setRecurrenceFrequency(e.target.value as RecurrenceFrequency)}
                  >
                    <option value="none">Does not repeat</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div className="grid gap-2">
                  <label
                    className="text-sm font-semibold text-[var(--foreground)]"
                    htmlFor="recurrence-count"
                  >
                    Occurrences
                  </label>
                  <input
                    id="recurrence-count"
                    type="number"
                    min="1"
                    max={recurrenceFrequency === "weekly" ? "12" : "24"}
                    disabled={!isAuthenticated || recurrenceFrequency === "none"}
                    value={recurrenceCount}
                    onChange={(e) => setRecurrenceCount(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <p className="rounded-2xl bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--muted)]">
                Editing updates only this transaction. Recurring creation is available when adding
                a new entry.
              </p>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <button type="submit" className="button-primary mt-2">
                {isAuthenticated
                  ? isEditing
                    ? "Save changes"
                    : "Add transaction"
                  : "Log in to add transactions"}
              </button>
              {isEditing ? (
                <button type="button" className="button-secondary mt-2" onClick={resetForm}>
                  Cancel edit
                </button>
              ) : null}
            </div>
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
                <h3 className="section-title text-[1.3rem]">
                  {isAuthenticated ? "No transactions yet" : "Log in to start tracking"}
                </h3>
                <p className="muted-copy mt-2 text-sm leading-6 sm:text-base">
                  {isAuthenticated
                    ? "Add your first entry to start building a clearer picture of your budget."
                    : "Create an account or log in to view your personal transactions and totals."}
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

                  <div className="flex w-full flex-wrap items-center justify-between gap-3 sm:w-auto sm:justify-end">
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
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="button-secondary"
                        onClick={() => startEditing(item)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="button-secondary"
                        onClick={() => removeTx(item.id)}
                      >
                        Delete
                      </button>
                    </div>
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
