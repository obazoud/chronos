1. Installation de node et de npm
https://github.com/ry/node/wiki/Installation
https://github.com/joyent/node/wiki/Installing-Node.js-via-package-manager

sudo add-apt-repository ppa:jerome-etienne/neoip
sudo apt-get update
sudo apt-get install nodejs

# cloud9
#curl http://npmjs.org/install.sh | sudo sh
#sudo npm install cloud9
sudo apt-get install libxml2-dev
git clone git://github.com/ajaxorg/o3
git clone git://github.com/ajaxorg/cloud9.git
git co -b devel remotes/origin/devel
./bin/cloud9.sh

# restler
curl http://npmjs.org/install.sh | sudo sh
sudo npm install restler

# node_hash
npm install node_hash

npm install journey

npm install cluster

2. Installation de journey https://github.com/cloudhead/journey
npm install journey
NB : vérifier que le fichier journey.js est bien dans sa dernière version https://github.com/cloudhead/journey/blob/master/lib/journey.js


3. Lancer node
dans le répertoire chronos-node :
$ node chronos.js
