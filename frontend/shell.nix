{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  packages = [
    pkgs.nodejs # Using LTS version is recommended
    
    # pkgs.pnpm

    # 3. Optional: Language Servers for your editor
    # pkgs.nodePackages.typescript-language-server
    # pkgs.nodePackages.vue-language-server
    # pkgs.tailwindcss-language-server
  ];

  shellHook = ''
    echo "Environment ready for Vue + Tailwind!"
    echo "Node version: $(node --version)"
  '';
}
