 document.addEventListener("DOMContentLoaded", async () => {
  // 1️⃣ Supabase client
  const supabaseUrl = "https://fzzxcshdetqruxquxrbe.supabase.co";
  const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6enhjc2hkZXRxcnV4cXV4cmJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4MjIyMDgsImV4cCI6MjA4OTM5ODIwOH0.5BjEQWW8n7k62Uw7_JhsmZlA9Anl-mKqFiWs2Wwlilc"; // replace with your anon key
  const supabase = supabase.createClient(supabaseUrl, supabaseKey);

  // 2️⃣ Ensure bucket exists
  async function ensureBucket() {
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets.some(b => b.name === "proofs")) {
      await supabase.storage.createBucket("proofs", { public: true });
      console.log("Bucket 'proofs' created.");
    } else {
      console.log("Bucket exists!");
    }
  }
  await ensureBucket();

  // 3️⃣ Submit function
  async function submitTask() {
    try {
      const name = document.getElementById("name").value.trim();
      const phone = document.getElementById("phone").value.trim();
      const file = document.getElementById("proof").files[0];

      if (!name || !phone || !file) {
        alert("Name, Phone, and Proof required!");
        return;
      }

      // 3a Get or create user
      let { data: user } = await supabase.from("users").select("*").eq("phone", phone).maybeSingle();
      if (!user) {
        const { data: newUser } = await supabase.from("users").insert([{ name, phone, points:0 }]).select().single();
        user = newUser;
      }

      // 3b Upload file
      const path = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from("proofs").upload(path, file);
      if (uploadError) throw uploadError;

      // 3c Add submission
      const points = 10;
      await supabase.from("submissions").insert([{ user_id:user.id, proof_url:path, points_awarded:points }]);

      // 3d Update points
      await supabase.from("users").update({ points: (user.points||0)+points }).eq("id", user.id);

      alert("Submission successful! +10 points!");
      loadLeaderboard();

    } catch(err) {
      console.error(err);
      alert(err.message);
    }
  }

  // 4️⃣ Load leaderboard
  async function loadLeaderboard() {
    const { data: users } = await supabase.from("users").select("name,points").order("points",{ascending:false}).limit(20);
    const board = document.getElementById("leaderboard");
    board.innerHTML = "";
    users.forEach((u,i)=> {
      let medal = i===0?"🥇":i===1?"🥈":i===2?"🥉":"";
      board.innerHTML += `<div class="card"><span>${medal} #${i+1}</span><strong>${u.name}</strong><span>${u.points||0} pts</span></div>`;
    });
  }

  document.getElementById("submitBtn").addEventListener("click", submitTask);
  loadLeaderboard();
});
