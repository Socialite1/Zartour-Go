document.addEventListener("DOMContentLoaded", async () => {
  const supabase = supabase.createClient(
    "https://fzzxcshdetqruxquxrbe.supabase.co",
    "YOUR_ANON_KEY_HERE"
  );

  async function loadLeaderboard() {
    const { data: users } = await supabase.from("users")
      .select("name, points")
      .order("points",{ascending:false})
      .limit(20);

    const board = document.getElementById("leaderboard");
    board.innerHTML = "";

    users.forEach((u,i)=>{
      let medal = i===0?"🥇":i===1?"🥈":i===2?"🥉":"";
      board.innerHTML += `<div class="card"><span>${medal} #${i+1}</span><strong>${u.name}</strong><span>${u.points||0} pts</span></div>`;
    });
  }

  loadLeaderboard();
});
