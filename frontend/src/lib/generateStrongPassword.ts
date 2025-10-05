// src/lib/generateStrongPassword.ts
export function generateStrongPassword(length = 14) {
    const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const lower = "abcdefghijkmnopqrstuvwxyz";
    const nums  = "23456789";
    const syms  = "!@#$%^&*?-_";
    const all = upper + lower + nums + syms;
  
    const pick = (pool: string) => pool[Math.floor(Math.random() * pool.length)];
    let pwd = pick(upper) + pick(lower) + pick(nums) + pick(syms);
  
    while (pwd.length < length) pwd += pick(all);
  
    // simple shuffle
    return pwd.split("").sort(() => Math.random() - 0.5).join("");
  }
  
  export function scorePassword(pwd: string) {
    // very simple strength score 0..4
    let s = 0;
    if (pwd.length >= 10) s++;
    if (pwd.length >= 14) s++;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) s++;
    if (/\d/.test(pwd)) s++;
    if (/[!@#$%^&*?\-_]/.test(pwd)) s++;
    return Math.min(s, 4);
  }
  
  export function strengthLabel(score: number) {
    return ["Weak", "Fair", "Good", "Strong", "Excellent"][score] || "Weak";
  }
  