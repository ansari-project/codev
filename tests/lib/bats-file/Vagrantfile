# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure("2") do |config|
  config.vm.box = "ubuntu/xenial64"
  config.vm.network "public_network"
  config.vm.synced_folder ".", "/home/vagrant/bats-file/", type: "rsync",
    rsync__exclude: [
      ".git/",
      ".gitignore",
      "*.yml",
      "*.md",
      "LICENSE",
      "*.json",
      "*.log",
      "Vagrantfile",
    ],
    rsync__args: ["--verbose", "--archive", "--delete", "-z"]

  config.vm.provider "virtualbox" do |vb|
    # vb.gui = true
    vb.memory = "1024"
  end
  config.vm.provision "shell", privileged: true, inline: <<-SHELL
    apt-get update
    apt-get install -y git vim curl
    ln -s /usr/bin/python3 /usr/bin/python
  SHELL

  config.vm.provision "shell", privileged: false, inline: <<-SHELL
    mkdir -p $HOME/.local/bin
    echo 'export PATH="$PATH:$HOME/.local/bin"' >> /home/vagrant/.bashrc
    git clone --depth 1 https://github.com/bats-core/bats-support /home/vagrant/bats-support
    /home/vagrant/bats-file/script/install-bats.sh
  SHELL
end
