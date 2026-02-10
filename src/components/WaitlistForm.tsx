import { createSignal, Show } from "solid-js";

export default function WaitlistForm() {
  const [email, setEmail] = createSignal("");
  const [status, setStatus] = createSignal<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = createSignal("");

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const val = email().trim();
    if (!val || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      setStatus("error");
      setErrorMsg("Enter a valid email.");
      return;
    }

    setStatus("loading");

    try {
      // TODO: Replace with Loops API endpoint
      // const res = await fetch("https://app.loops.so/api/v1/contacts/create", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //     Authorization: "Bearer YOUR_LOOPS_API_KEY",
      //   },
      //   body: JSON.stringify({ email: val, source: "waitlist", subscribed: true }),
      // });
      // if (!res.ok) throw new Error("Failed to subscribe");

      await new Promise((resolve) => setTimeout(resolve, 600));
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMsg("Something went wrong — try again.");
    }
  };

  return (
    <div>
      <Show
        when={status() !== "success"}
        fallback={
          <p class="text-[13px] uppercase tracking-[0.15em] text-dark/50">
            You're on the list.
          </p>
        }
      >
        <form
          onSubmit={handleSubmit}
          class="flex flex-col sm:flex-row gap-3 max-w-lg"
          aria-label="Join waitlist"
        >
          <input
            type="email"
            value={email()}
            onInput={(e) => {
              setEmail(e.currentTarget.value);
              if (status() === "error") {
                setStatus("idle");
                setErrorMsg("");
              }
            }}
            placeholder="your@email.com"
            class="flex-1 px-4 py-3 bg-transparent border border-dark/15 rounded-[4px] text-dark text-base font-sans placeholder:text-dark/30 outline-none focus:border-dark transition-colors"
            aria-label="Email address"
            required
          />
          <button
            type="submit"
            disabled={status() === "loading"}
            class="px-6 py-3 bg-dark text-bg text-base font-sans font-medium rounded-[4px] cursor-pointer disabled:opacity-50 transition-opacity hover:opacity-80"
          >
            {status() === "loading" ? "Joining..." : "Join waitlist"}
          </button>
        </form>
        <Show when={errorMsg()}>
          <p class="mt-2 text-[13px] text-dark/60" role="alert">
            {errorMsg()}
          </p>
        </Show>
      </Show>
    </div>
  );
}
