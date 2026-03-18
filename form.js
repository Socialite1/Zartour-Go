document.addEventListener("DOMContentLoaded", async () => {
  const supabase = supabase.createClient(
    "https://fzzxcshdetqruxquxrbe.supabase.co",
    "YOUR_ANON_KEY_HERE"
  );

  async function ensureBucket() {
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets.some(b => b.name === "proofs")) {
      await supabase.storage.createBucket("proofs", { public: true });
    }
  }
  await ensureBucket();

  async function submitTask() {
    try {
      const name = document.getElementById("name").value.trim();
      const email = document.getElementById("email").value.trim();
      const phone = document.getElementById("phone").value.trim();
      const address = document.getElementById("address").value.trim();
      const place = document.getElementById("place").value.trim();
      const knowledge = document.getElementById("knowledge").value.trim();
      const file = document.getElementById("proof").files[0];

      if (!name || !phone || !file) {
        alert("Name, Phone, and Proof image required!");
        return;
      }

      // Get or create user
      let { data: user } = await supabase.from("users").select("*").eq("phone", phone).maybeSingle();
      if (!user) {
        const { data: newUser } = await supabase.from("users")
          .insert([{ name, email, phone, address, points:0 }])
          .select().single();
        user = newUser;
      }

      // Upload proof
      const path = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from("proofs").upload(path, file);
      if (uploadError) throw uploadError;

      // Add submission + points
      const points = 10;
      await supabase.from("submissions").insert([{ user_id:user.id, proof_url:path, points_awarded:points }]);
      await supabase.from("users").update({ points:(user.points||0)+points }).eq("id", user.id);

      // ✅ Redirect to leaderboard page after submission
      window.location.href = "leaderboard.html";

    } catch(err) {
      console.error(err);
      alert(err.message);
    }
  }

  document.getElementById("submitBtn").addEventListener("click", submitTask);
});
