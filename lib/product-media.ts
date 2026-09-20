export const productMedia: Record<string, string> = {
  "smartphone-128gb": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=85",
  "slim-laptop-156": "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=85",
  "unisex-running-shoes": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=85",
  "home-led-lamp": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=85",
  "body-oil-250ml": "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=900&q=85",
  "football-match-ball": "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=900&q=85",
  "modern-office-chair": "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=900&q=85",
  "wireless-headphones": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85",
};

export const categoryMedia: Record<string, string> = {
  phones: productMedia["smartphone-128gb"],
  computers: productMedia["slim-laptop-156"],
  fashion: productMedia["unisex-running-shoes"],
  home: productMedia["home-led-lamp"],
  beauty: productMedia["body-oil-250ml"],
  sports: productMedia["football-match-ball"],
  furniture: productMedia["modern-office-chair"],
  electronics: productMedia["wireless-headphones"],
};
