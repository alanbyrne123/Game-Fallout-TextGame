// FALLOUT: Wasteland Chronicles - Text Adventure Game Engine
class FalloutAdventure {
    constructor() {
        this.gameState = 'menu';
        this.gameTime = 0;
        this.gameStartTime = Date.now();
        
        // Character System
        this.player = {
            name: 'Vault Dweller',
            level: 1,
            experience: 0,
            hp: 100,
            maxHp: 100,
            ap: 100,
            maxAp: 100,
            rads: 0,
            maxRads: 100,
            caps: 0,
            weight: 0,
            maxWeight: 150,
            special: {
                strength: 5,
                perception: 5,
                endurance: 5,
                charisma: 5,
                intelligence: 5,
                agility: 5,
                luck: 5
            },
            skills: {
                smallGuns: 0,
                bigGuns: 0,
                energyWeapons: 0,
                unarmed: 0,
                melee: 0,
                throwing: 0,
                firstAid: 0,
                doctor: 0,
                sneak: 0,
                lockpick: 0,
                steal: 0,
                traps: 0,
                science: 0,
                repair: 0,
                speech: 0,
                barter: 0,
                gambling: 0,
                outdoorsman: 0
            },
            inventory: [],
            equipped: {
                weapon: null,
                armor: null
            },
            talkedToNPCs: [],
            combatEncounters: 0
        };
        
        // Game World
        this.currentLocation = 'vault101';
        this.visitedLocations = new Set(['vault101']);
        this.activeQuests = [];
        this.completedQuests = [];
        
        // Combat System
        this.inCombat = false;
        this.currentEnemy = null;
        this.combatActions = [];
        
        // Dialogue System
        this.currentDialogueNPC = null;
        
        // Game Data
        this.locations = this.initializeLocations();
        this.npcs = this.initializeNPCs();
        this.items = this.initializeItems();
        this.quests = this.initializeQuests();
        this.enemies = this.initializeEnemies();
        
        this.initializeEventListeners();
        this.updateUI();
        this.startGameLoop();
    }
    
    initializeEventListeners() {
        const input = document.getElementById('gameInput');
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.processCommand(input.value.trim());
                input.value = '';
            }
        });
        
        input.focus();
    }
    
    startGameLoop() {
        setInterval(() => {
            this.gameTime++;
            this.updateUI();
        }, 1000);
    }
    
    // Game Commands
    processCommand(command) {
        if (!command) return;
        
        const words = command.toLowerCase().split(' ');
        const verb = words[0];
        const noun = words.slice(1).join(' ');
        
        this.addText(`> ${command}`, 'info');
        
        // Check if we're in combat first
        if (this.inCombat) {
            this.processCombatCommand(command);
            return;
        }
        
        // Check if we're in dialogue
        if (this.currentDialogueNPC) {
            if (this.processDialogueCommand(command)) {
                return;
            }
        }
        
        switch (verb) {
            case 'look':
            case 'l':
                this.lookCommand(noun);
                break;
            case 'examine':
            case 'ex':
            case 'inspect':
                this.examineCommand(noun);
                break;
            case 'go':
            case 'move':
            case 'walk':
                this.goCommand(noun);
                break;
            case 'take':
            case 'get':
            case 'pick':
                this.takeCommand(noun);
                break;
            case 'use':
                this.useCommand(noun);
                break;
            case 'talk':
            case 'speak':
                this.talkCommand(noun);
                break;
            case 'attack':
            case 'fight':
                this.attackCommand(noun);
                break;
            case 'flee':
            case 'run':
                this.addText('You are not in combat.', 'error');
                break;
            case 'inventory':
            case 'inv':
            case 'i':
                this.inventoryCommand();
                break;
            case 'stats':
            case 'character':
                this.statsCommand();
                break;
            case 'help':
            case 'h':
                this.helpCommand();
                break;
            case 'save':
                this.saveCommand();
                break;
            case 'load':
                this.loadCommand();
                break;
            case 'quit':
            case 'exit':
                this.quitCommand();
                break;
            default:
                this.addText(`Unknown command: ${verb}. Type 'help' for available commands.`, 'error');
        }
    }
    
    lookCommand(noun) {
        const location = this.locations[this.currentLocation];
        
        if (!noun) {
            this.addText(location.description, 'highlight');
            this.addText(`\nExits: ${location.exits.map(exit => exit.direction).join(', ')}`, 'info');
            
            if (location.items && location.items.length > 0) {
                this.addText(`\nItems here: ${location.items.map(item => item.name).join(', ')}`, 'info');
            }
            
            if (location.npcs && location.npcs.length > 0) {
                this.addText(`\nPeople here: ${location.npcs.map(npc => npc.name).join(', ')}`, 'info');
            }
            
            if (location.enemies && location.enemies.length > 0) {
                this.addText(`\nEnemies: ${location.enemies.map(enemy => enemy.name).join(', ')}`, 'error');
            }
        } else {
            // Check if looking in a direction first
            const direction = this.checkDirectionLook(noun);
            if (direction) {
                return; // Direction look was handled
            }
            
            // Look at specific item or NPC
            const item = this.findItemInLocation(noun);
            const npc = this.findNPCInLocation(noun);
            const enemy = this.findEnemyInLocation(noun);
            
            if (item) {
                this.addText(item.description, 'info');
            } else if (npc) {
                this.addText(npc.description, 'info');
            } else if (enemy) {
                this.addText(enemy.description, 'error');
            } else {
                this.addText(`You don't see ${noun} here.`, 'error');
            }
        }
    }
    
    checkDirectionLook(direction) {
        const location = this.locations[this.currentLocation];
        const exit = location.exits.find(exit => 
            exit.direction.toLowerCase() === direction.toLowerCase() ||
            exit.direction.toLowerCase().includes(direction.toLowerCase())
        );
        
        if (exit) {
            const targetLocation = this.locations[exit.location];
            this.addText(`Looking ${exit.direction}, you see:`, 'info');
            this.addText(targetLocation.shortDescription, 'highlight');
            
            // Add some additional details about what you can see
            if (targetLocation.enemies && targetLocation.enemies.length > 0) {
                this.addText(`You can see ${targetLocation.enemies.length} enemy(ies) in the distance.`, 'error');
            }
            
            if (targetLocation.npcs && targetLocation.npcs.length > 0) {
                this.addText(`You can see ${targetLocation.npcs.length} person(s) there.`, 'info');
            }
            
            if (targetLocation.items && targetLocation.items.length > 0) {
                this.addText(`You notice some items scattered about.`, 'info');
            }
            
            return true;
        }
        
        return false;
    }
    
    examineCommand(itemName) {
        if (!itemName) {
            this.addText('Examine what?', 'error');
            return;
        }
        
        // Check inventory first
        const inventoryItem = this.findItemInInventory(itemName);
        if (inventoryItem) {
            this.examineItem(inventoryItem);
            return;
        }
        
        // Check location items
        const locationItem = this.findItemInLocation(itemName);
        if (locationItem) {
            this.examineItem(locationItem);
            return;
        }
        
        this.addText(`You don't see ${itemName} here or in your inventory.`, 'error');
    }
    
    examineItem(item) {
        this.addText(`Examining ${item.name}:`, 'highlight');
        this.addText(item.description, 'info');
        
        // Show item stats based on type
        if (item.type === 'weapon') {
            this.addText(`Type: Weapon`, 'info');
            this.addText(`Damage: ${item.damage}`, 'info');
            this.addText(`Weight: ${item.weight} lbs`, 'info');
            if (item.durability) {
                this.addText(`Durability: ${item.durability}%`, 'info');
            }
        } else if (item.type === 'armor') {
            this.addText(`Type: Armor`, 'info');
            this.addText(`Defense: ${item.defense || 0}`, 'info');
            this.addText(`Weight: ${item.weight} lbs`, 'info');
            if (item.durability) {
                this.addText(`Durability: ${item.durability}%`, 'info');
            }
        } else if (item.type === 'consumable') {
            this.addText(`Type: Consumable`, 'info');
            this.addText(`Weight: ${item.weight} lbs`, 'info');
            if (item.effect) {
                this.addText(`Effect: ${this.getEffectDescription(item.effect)}`, 'info');
            }
        } else if (item.type === 'currency') {
            this.addText(`Type: Currency`, 'info');
            this.addText(`Weight: ${item.weight} lbs`, 'info');
        } else {
            this.addText(`Type: ${item.type}`, 'info');
            this.addText(`Weight: ${item.weight} lbs`, 'info');
        }
        
        // Show if equipped
        if (this.player.equipped.weapon === item) {
            this.addText(`Status: Equipped (Weapon)`, 'success');
        } else if (this.player.equipped.armor === item) {
            this.addText(`Status: Equipped (Armor)`, 'success');
        }
    }
    
    getEffectDescription(effect) {
        switch (effect.type) {
            case 'heal':
                return `Restores ${effect.value} HP`;
            case 'rads':
                return effect.value > 0 ? `Adds ${effect.value} radiation` : `Removes ${Math.abs(effect.value)} radiation`;
            case 'stat':
                return `${effect.value > 0 ? '+' : ''}${effect.value} to ${effect.stat}`;
            default:
                return 'Unknown effect';
        }
    }
    
    goCommand(direction) {
        const location = this.locations[this.currentLocation];
        const exit = location.exits.find(exit => 
            exit.direction.toLowerCase() === direction.toLowerCase() ||
            exit.direction.toLowerCase().includes(direction.toLowerCase())
        );
        
        if (exit) {
            if (exit.requirement && !this.checkRequirement(exit.requirement)) {
                this.addText(exit.blockedMessage || `You can't go ${direction} right now.`, 'error');
                return;
            }
            
            this.currentLocation = exit.location;
            this.visitedLocations.add(this.currentLocation);
            this.addText(`You go ${direction}.`, 'success');
            this.lookCommand();
            this.updateLocationUI();
        } else {
            this.addText(`You can't go ${direction}.`, 'error');
        }
    }
    
    takeCommand(itemName) {
        // Handle "take all" command
        if (itemName.toLowerCase() === 'all') {
            this.takeAllCommand();
            return;
        }
        
        const item = this.findItemInLocation(itemName);
        
        if (!item) {
            this.addText(`You don't see ${itemName} here.`, 'error');
            return;
        }
        
        if (this.player.weight + item.weight > this.player.maxWeight) {
            this.addText(`You can't carry ${item.name}. It's too heavy!`, 'error');
            return;
        }
        
        this.addItemToInventory(item);
        this.locations[this.currentLocation].items = this.locations[this.currentLocation].items.filter(i => i !== item);
        
        if (item.name === 'Bottle Cap' && item.type === 'currency') {
            this.addText(`You collect a bottle cap (1 cap)`, 'success');
        } else {
            this.addText(`You take the ${item.name}.`, 'success');
        }
        this.updateInventoryUI();
    }
    
    takeAllCommand() {
        const location = this.locations[this.currentLocation];
        const items = [...location.items]; // Copy the array
        let takenItems = [];
        let skippedItems = [];
        let capsFound = 0;
        
        if (items.length === 0) {
            this.addText('There are no items here to take.', 'info');
            return;
        }
        
        for (const item of items) {
            if (item.name === 'Bottle Cap' && item.type === 'currency') {
                // Bottle caps don't count against weight
                this.player.caps += 1;
                capsFound++;
                location.items = location.items.filter(i => i !== item);
            } else if (this.player.weight + item.weight <= this.player.maxWeight) {
                this.addItemToInventory(item);
                takenItems.push(item.name);
                // Remove from location
                location.items = location.items.filter(i => i !== item);
            } else {
                skippedItems.push(item.name);
            }
        }
        
        if (capsFound > 0) {
            this.addText(`You collect ${capsFound} bottle cap(s) (${capsFound} caps)`, 'success');
        }
        
        if (takenItems.length > 0) {
            this.addText(`You take: ${takenItems.join(', ')}`, 'success');
        }
        
        if (skippedItems.length > 0) {
            this.addText(`You can't carry: ${skippedItems.join(', ')} (too heavy)`, 'error');
        }
        
        this.updateInventoryUI();
    }
    
    useCommand(itemName) {
        const item = this.findItemInInventory(itemName);
        
        if (!item) {
            this.addText(`You don't have ${itemName}.`, 'error');
            return;
        }
        
        if (item.type === 'weapon') {
            this.equipWeapon(item);
        } else if (item.type === 'armor') {
            this.equipArmor(item);
        } else if (item.type === 'consumable') {
            this.useConsumable(item);
        } else if (item.type === 'key') {
            this.useKey(item);
        } else {
            this.addText(`You can't use ${item.name} that way.`, 'error');
        }
    }
    
    talkCommand(npcName) {
        const npc = this.findNPCInLocation(npcName);
        
        if (!npc) {
            this.addText(`You don't see ${npcName} here.`, 'error');
            return;
        }
        
        this.startDialogue(npc);
    }
    
    startDialogue(npc) {
        this.addText(`You talk to ${npc.name}.`, 'info');
        this.addText(`"${npc.dialogue}"`, 'highlight');
        
        // Track NPC conversation
        if (!this.player.talkedToNPCs.includes(npc.name)) {
            this.player.talkedToNPCs.push(npc.name);
        }
        
        // Show dialogue options if available
        if (npc.dialogueOptions && npc.dialogueOptions.length > 0) {
            this.addText('\nWhat do you want to ask?', 'info');
            npc.dialogueOptions.forEach((option, index) => {
                this.addText(`${index + 1}. ${option.text}`, 'info');
            });
            this.addText('Type the number to select an option, or "bye" to end the conversation.', 'info');
            
            // Store current NPC for dialogue continuation
            this.currentDialogueNPC = npc;
        }
        
        if (npc.quest) {
            this.offerQuest(npc.quest);
        }
    }
    
    processDialogueCommand(command) {
        if (!this.currentDialogueNPC) return false;
        
        const words = command.toLowerCase().split(' ');
        const verb = words[0];
        
        if (verb === 'bye' || verb === 'goodbye' || verb === 'end') {
            this.addText(`You end the conversation with ${this.currentDialogueNPC.name}.`, 'info');
            this.currentDialogueNPC = null;
            return true;
        }
        
        // Check if it's a number for dialogue options
        const optionNumber = parseInt(verb);
        if (!isNaN(optionNumber) && this.currentDialogueNPC.dialogueOptions) {
            const option = this.currentDialogueNPC.dialogueOptions[optionNumber - 1];
            if (option) {
                this.addText(`You ask: "${option.text}"`, 'info');
                this.addText(`"${option.response}"`, 'highlight');
                
                // Handle any special effects
                if (option.effect) {
                    this.handleDialogueEffect(option.effect);
                }
                
                // Show follow-up options if available
                if (option.followUp && option.followUp.length > 0) {
                    this.addText('\nWhat else do you want to ask?', 'info');
                    option.followUp.forEach((followOption, index) => {
                        this.addText(`${index + 1}. ${followOption.text}`, 'info');
                    });
                }
                
                return true;
            }
        }
        
        return false;
    }
    
    handleDialogueEffect(effect) {
        switch (effect.type) {
            case 'give_item':
                const item = this.items[effect.item];
                if (item) {
                    this.addItemToInventory(item);
                    this.addText(`You receive: ${item.name}`, 'success');
                }
                break;
            case 'give_caps':
                this.player.caps += effect.amount;
                this.addText(`You receive ${effect.amount} caps.`, 'success');
                break;
            case 'complete_quest':
                this.completeQuest(effect.quest);
                break;
            case 'offer_quest':
                this.offerQuest(effect.quest);
                break;
        }
    }
    
    attackCommand(targetName) {
        const enemy = this.findEnemyInLocation(targetName);
        
        if (!enemy) {
            this.addText(`You don't see ${targetName} here.`, 'error');
            return;
        }
        
        this.startCombat(enemy);
    }
    
    inventoryCommand() {
        if (this.player.inventory.length === 0) {
            this.addText('Your inventory is empty.', 'info');
            return;
        }
        
        this.addText('Inventory:', 'highlight');
        this.player.inventory.forEach((item, index) => {
            let displayText = `${index + 1}. ${item.name}`;
            if (item.count && item.count > 1) {
                displayText += ` (x${item.count})`;
            }
            displayText += ` (${item.weight * (item.count || 1)} lbs)`;
            this.addText(displayText, 'info');
        });
    }
    
    statsCommand() {
        this.addText('Character Stats:', 'highlight');
        this.addText(`Level: ${this.player.level}`, 'info');
        this.addText(`HP: ${this.player.hp}/${this.player.maxHp}`, 'info');
        this.addText(`AP: ${this.player.ap}/${this.player.maxAp}`, 'info');
        this.addText(`Rads: ${this.player.rads}/${this.player.maxRads}`, 'info');
        this.addText(`Caps: ${this.player.caps}`, 'info');
        this.addText(`Weight: ${this.player.weight}/${this.player.maxWeight}`, 'info');
        
        this.addText('\nS.P.E.C.I.A.L.:', 'highlight');
        Object.entries(this.player.special).forEach(([stat, value]) => {
            this.addText(`${stat.toUpperCase()}: ${value}`, 'info');
        });
    }
    
    helpCommand() {
        this.addText('Available Commands:', 'highlight');
        this.addText('look/l [item] - Look around or at specific item', 'info');
        this.addText('examine/ex/inspect [item] - Examine item stats in detail', 'info');
        this.addText('go/move/walk [direction] - Move in a direction', 'info');
        this.addText('take/get/pick [item] - Take an item', 'info');
        this.addText('take/get/pick all - Take all items here', 'info');
        this.addText('use [item] - Use an item', 'info');
        this.addText('talk/speak [person] - Talk to someone', 'info');
        this.addText('attack/fight [enemy] - Attack an enemy', 'info');
        this.addText('inventory/inv/i - Check your inventory', 'info');
        this.addText('stats/character - View character stats', 'info');
        this.addText('help/h - Show this help', 'info');
        this.addText('save - Save your game', 'info');
        this.addText('load - Load your game', 'info');
        this.addText('quit/exit - Quit the game', 'info');
    }
    
    saveCommand() {
        const saveData = {
            player: this.player,
            currentLocation: this.currentLocation,
            visitedLocations: Array.from(this.visitedLocations),
            activeQuests: this.activeQuests,
            completedQuests: this.completedQuests,
            gameTime: this.gameTime
        };
        
        localStorage.setItem('falloutAdventureSave', JSON.stringify(saveData));
        this.addText('Game saved successfully!', 'success');
    }
    
    loadCommand() {
        const saveData = localStorage.getItem('falloutAdventureSave');
        
        if (!saveData) {
            this.addText('No save file found.', 'error');
            return;
        }
        
        try {
            const data = JSON.parse(saveData);
            this.player = data.player;
            this.currentLocation = data.currentLocation;
            this.visitedLocations = new Set(data.visitedLocations);
            this.activeQuests = data.activeQuests || [];
            this.completedQuests = data.completedQuests || [];
            this.gameTime = data.gameTime;
            
            // Consolidate duplicate items after loading
            this.consolidateInventory();
            
            this.addText('Game loaded successfully!', 'success');
            this.updateUI();
            this.lookCommand();
        } catch (error) {
            this.addText('Error loading save file.', 'error');
        }
    }
    
    quitCommand() {
        this.addText('Thanks for playing Fallout: Wasteland Chronicles!', 'highlight');
        this.addText('Your progress has been saved automatically.', 'info');
        this.saveCommand();
    }
    
    // Combat System
    startCombat(enemy) {
        this.inCombat = true;
        this.currentEnemy = enemy;
        this.addText(`Combat started! You are fighting ${enemy.name}!`, 'error');
        this.addText(`${enemy.name}: ${enemy.hp}/${enemy.maxHp} HP`, 'error');
        this.addText('Type "attack" to fight or "flee" to run away.', 'info');
        
        // Track combat encounter
        this.player.combatEncounters++;
    }
    
    processCombatCommand(command) {
        if (!this.inCombat) return;
        
        const words = command.toLowerCase().split(' ');
        const verb = words[0];
        
        switch (verb) {
            case 'attack':
                this.performAttack();
                break;
            case 'flee':
            case 'run':
                this.fleeCombat();
                break;
            case 'use':
                const itemName = words.slice(1).join(' ');
                this.useItemInCombat(itemName);
                break;
            default:
                this.addText('In combat! Use "attack", "flee", or "use [item]".', 'error');
        }
    }
    
    performAttack() {
        if (!this.currentEnemy) return;
        
        const damage = this.calculateDamage();
        this.currentEnemy.hp -= damage;
        
        this.addText(`You attack ${this.currentEnemy.name} for ${damage} damage!`, 'success');
        
        if (this.currentEnemy.hp <= 0) {
            this.endCombat(true);
            return;
        }
        
        // Enemy attacks back
        const enemyDamage = this.calculateEnemyDamage();
        this.player.hp -= enemyDamage;
        this.addText(`${this.currentEnemy.name} attacks you for ${enemyDamage} damage!`, 'error');
        
        if (this.player.hp <= 0) {
            this.gameOver();
            return;
        }
        
        this.addText(`${this.currentEnemy.name}: ${this.currentEnemy.hp}/${this.currentEnemy.maxHp} HP`, 'error');
        this.updateUI();
    }
    
    fleeCombat() {
        this.addText('You flee from combat!', 'info');
        this.endCombat(false);
    }
    
    useItemInCombat(itemName) {
        const item = this.findItemInInventory(itemName);
        
        if (!item) {
            this.addText(`You don't have ${itemName}.`, 'error');
            return;
        }
        
        if (item.type === 'consumable') {
            this.useConsumable(item);
            this.addText(`You use ${item.name} in combat!`, 'success');
        } else {
            this.addText(`You can't use ${item.name} in combat.`, 'error');
        }
    }
    
    endCombat(victory) {
        this.inCombat = false;
        
        if (victory) {
            this.addText(`You defeated ${this.currentEnemy.name}!`, 'success');
            this.gainExperience(this.currentEnemy.experience);
            
            // Drop loot
            if (this.currentEnemy.loot) {
                this.currentEnemy.loot.forEach(item => {
                    this.locations[this.currentLocation].items.push(item);
                });
                this.addText(`${this.currentEnemy.name} dropped some items!`, 'info');
            }
            
            // Remove enemy from location
            this.locations[this.currentLocation].enemies = 
                this.locations[this.currentLocation].enemies.filter(e => e !== this.currentEnemy);
        }
        
        this.currentEnemy = null;
    }
    
    calculateDamage() {
        const baseDamage = this.player.equipped.weapon ? this.player.equipped.weapon.damage : 5;
        const strengthBonus = Math.floor(this.player.special.strength / 2);
        const luckBonus = Math.floor(this.player.special.luck / 3);
        
        return baseDamage + strengthBonus + luckBonus + Math.floor(Math.random() * 5);
    }
    
    calculateEnemyDamage() {
        return this.currentEnemy.damage + Math.floor(Math.random() * 3);
    }
    
    // Utility Functions
    findItemInLocation(itemName) {
        const location = this.locations[this.currentLocation];
        return location.items.find(item => 
            item.name.toLowerCase().includes(itemName.toLowerCase())
        );
    }
    
    findItemInInventory(itemName) {
        return this.player.inventory.find(item => 
            item.name.toLowerCase().includes(itemName.toLowerCase())
        );
    }
    
    findNPCInLocation(npcName) {
        const location = this.locations[this.currentLocation];
        return location.npcs.find(npc => 
            npc.name.toLowerCase().includes(npcName.toLowerCase())
        );
    }
    
    findEnemyInLocation(enemyName) {
        const location = this.locations[this.currentLocation];
        return location.enemies.find(enemy => 
            enemy.name.toLowerCase().includes(enemyName.toLowerCase())
        );
    }
    
    checkRequirement(requirement) {
        switch (requirement.type) {
            case 'item':
                return this.findItemInInventory(requirement.item);
            case 'skill':
                return this.player.skills[requirement.skill] >= requirement.value;
            case 'special':
                return this.player.special[requirement.stat] >= requirement.value;
            case 'quest':
                return this.completedQuests.includes(requirement.quest);
            default:
                return true;
        }
    }
    
    equipWeapon(weapon) {
        this.player.equipped.weapon = weapon;
        this.addText(`You equip ${weapon.name}.`, 'success');
    }
    
    equipArmor(armor) {
        this.player.equipped.armor = armor;
        this.addText(`You equip ${armor.name}.`, 'success');
    }
    
    useConsumable(item) {
        if (item.effect) {
            this.applyEffect(item.effect);
            this.addText(`You use ${item.name}.`, 'success');
            this.removeItemFromInventory(item);
        }
    }
    
    useKey(key) {
        // Key usage logic would go here
        this.addText(`You use ${key.name}.`, 'success');
    }
    
    applyEffect(effect) {
        switch (effect.type) {
            case 'heal':
                this.player.hp = Math.min(this.player.maxHp, this.player.hp + effect.value);
                break;
            case 'rads':
                this.player.rads = Math.min(this.player.maxRads, this.player.rads + effect.value);
                break;
            case 'stat':
                this.player.special[effect.stat] += effect.value;
                break;
        }
    }
    
    removeItemFromInventory(item) {
        if (item.count && item.count > 1) {
            // Reduce count for stacked items
            item.count--;
            this.player.weight -= item.weight;
        } else {
            // Remove item completely
            this.player.inventory = this.player.inventory.filter(i => i !== item);
            this.player.weight -= item.weight;
        }
        this.updateInventoryUI();
    }
    
    gainExperience(amount) {
        this.player.experience += amount;
        this.addText(`You gain ${amount} experience points!`, 'success');
        
        // Check for level up
        const requiredExp = this.player.level * 100;
        if (this.player.experience >= requiredExp) {
            this.levelUp();
        }
    }
    
    levelUp() {
        this.player.level++;
        this.player.experience = 0;
        this.player.maxHp += 10;
        this.player.hp = this.player.maxHp;
        this.player.maxAp += 5;
        this.player.ap = this.player.maxAp;
        
        this.addText(`Level up! You are now level ${this.player.level}!`, 'highlight');
        this.addText('Your health and action points have increased!', 'success');
    }
    
    offerQuest(questId) {
        const quest = this.quests[questId];
        if (!quest) {
            this.addText(`Quest not found: ${questId}`, 'error');
            return;
        }
        
        if (!this.activeQuests) {
            this.activeQuests = [];
        }
        
        if (!this.activeQuests.includes(questId)) {
            this.activeQuests.push(questId);
            this.addText(`New quest: ${quest.name}`, 'highlight');
            this.addText(quest.description, 'info');
            this.addText(`Objectives: ${quest.objectives.join(', ')}`, 'info');
            this.updateQuestUI();
        }
    }
    
    completeQuest(questId) {
        const quest = this.quests[questId];
        if (!quest) return;
        
        if (this.activeQuests && this.activeQuests.includes(questId)) {
            this.activeQuests = this.activeQuests.filter(q => q !== questId);
            this.completedQuests.push(questId);
            
            this.addText(`Quest completed: ${quest.name}`, 'success');
            
            // Give rewards
            if (quest.reward.experience) {
                this.gainExperience(quest.reward.experience);
            }
            if (quest.reward.caps) {
                this.player.caps += quest.reward.caps;
                this.addText(`You receive ${quest.reward.caps} caps!`, 'success');
            }
            
            this.updateQuestUI();
        }
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        this.addText('You have died in the wasteland...', 'error');
        this.showGameOverScreen();
    }
    
    showGameOverScreen() {
        document.getElementById('finalLevel').textContent = this.player.level;
        document.getElementById('finalCaps').textContent = this.player.caps;
        document.getElementById('finalQuests').textContent = this.completedQuests.length;
        document.getElementById('finalTime').textContent = this.formatTime(this.gameTime);
        document.getElementById('gameOverScreen').classList.add('active');
    }
    
    restartGame() {
        location.reload();
    }
    
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    // UI Updates
    updateUI() {
        this.updateCharacterUI();
        this.updateInventoryUI();
        this.updateLocationUI();
        this.updateQuestUI();
        this.updateTimeUI();
    }
    
    updateCharacterUI() {
        document.getElementById('charName').textContent = this.player.name;
        document.getElementById('charLevel').textContent = this.player.level;
        document.getElementById('hpValue').textContent = `${this.player.hp}/${this.player.maxHp}`;
        document.getElementById('apValue').textContent = `${this.player.ap}/${this.player.maxAp}`;
        document.getElementById('radValue').textContent = `${this.player.rads}/${this.player.maxRads}`;
        
        // Update stat bars
        document.getElementById('hpBar').style.width = `${(this.player.hp / this.player.maxHp) * 100}%`;
        document.getElementById('apBar').style.width = `${(this.player.ap / this.player.maxAp) * 100}%`;
        document.getElementById('radBar').style.width = `${(this.player.rads / this.player.maxRads) * 100}%`;
        
        // Update SPECIAL stats
        Object.entries(this.player.special).forEach(([stat, value]) => {
            document.getElementById(stat).textContent = value;
        });
    }
    
    addItemToInventory(item) {
        // Handle currency items (bottle caps) - convert to caps instead of inventory
        if (item.name === 'Bottle Cap' && item.type === 'currency') {
            this.player.caps += 1;
            return; // Don't add to inventory
        }
        
        // Check if item can be stacked
        if (this.canStackItem(item)) {
            const existingItem = this.player.inventory.find(invItem => 
                invItem.name === item.name && invItem.type === item.type
            );
            
            if (existingItem) {
                // Stack with existing item
                existingItem.count = (existingItem.count || 1) + 1;
                this.player.weight += item.weight;
            } else {
                // Add new stackable item
                const stackableItem = { ...item, count: 1 };
                this.player.inventory.push(stackableItem);
                this.player.weight += item.weight;
            }
        } else {
            // Non-stackable item
            this.player.inventory.push(item);
            this.player.weight += item.weight;
        }
    }
    
    canStackItem(item) {
        // Items that can be stacked
        const stackableTypes = ['currency', 'consumable', 'ammo'];
        const stackableNames = ['Bottle Cap', 'Pre-War Money'];
        
        return stackableTypes.includes(item.type) || stackableNames.includes(item.name);
    }
    
    consolidateInventory() {
        const consolidatedInventory = [];
        const itemMap = new Map();
        
        // First, reset weight to 0
        this.player.weight = 0;
        
        // Group items by name and type
        this.player.inventory.forEach(item => {
            // Convert bottle caps to caps instead of keeping in inventory
            if (item.name === 'Bottle Cap' && item.type === 'currency') {
                this.player.caps += (item.count || 1);
                return; // Skip adding to inventory
            }
            
            const key = `${item.name}_${item.type}`;
            
            if (this.canStackItem(item)) {
                if (itemMap.has(key)) {
                    // Add to existing stack
                    const existingItem = itemMap.get(key);
                    existingItem.count = (existingItem.count || 1) + (item.count || 1);
                } else {
                    // Create new stack
                    const stackableItem = { ...item, count: item.count || 1 };
                    itemMap.set(key, stackableItem);
                }
            } else {
                // Non-stackable item, add as-is
                consolidatedInventory.push(item);
                this.player.weight += item.weight;
            }
        });
        
        // Add all stacked items to inventory
        itemMap.forEach(item => {
            consolidatedInventory.push(item);
            this.player.weight += item.weight * item.count;
        });
        
        // Replace inventory with consolidated version
        this.player.inventory = consolidatedInventory;
    }
    
    updateInventoryUI() {
        const inventoryList = document.getElementById('inventoryList');
        inventoryList.innerHTML = '';
        
        if (this.player.inventory.length === 0) {
            inventoryList.innerHTML = '<div class="inventory-item">- Empty -</div>';
        } else {
            this.player.inventory.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'inventory-item';
                
                let displayText = item.name;
                if (item.count && item.count > 1) {
                    displayText += ` (x${item.count})`;
                }
                displayText += ` (${item.weight * (item.count || 1)} lbs)`;
                
                itemDiv.textContent = displayText;
                inventoryList.appendChild(itemDiv);
            });
        }
        
        document.getElementById('caps').textContent = this.player.caps;
        document.getElementById('weight').textContent = this.player.weight;
        document.getElementById('maxWeight').textContent = this.player.maxWeight;
    }
    
    updateLocationUI() {
        const location = this.locations[this.currentLocation];
        document.getElementById('currentLocation').textContent = location.name;
        document.getElementById('locationDesc').textContent = location.shortDescription;
    }
    
    updateQuestUI() {
        const questList = document.getElementById('questList');
        questList.innerHTML = '';
        
        if (!this.activeQuests || this.activeQuests.length === 0) {
            questList.innerHTML = '<div class="quest-item">No active quests</div>';
        } else {
            this.activeQuests.forEach(questId => {
                const quest = this.quests[questId];
                if (quest) {
                    const questDiv = document.createElement('div');
                    questDiv.className = 'quest-item active clickable';
                    questDiv.textContent = quest.name;
                    questDiv.onclick = () => this.showQuestDetails(questId);
                    questList.appendChild(questDiv);
                }
            });
        }
        
        // Add completed quests section
        if (this.completedQuests && this.completedQuests.length > 0) {
            const completedHeader = document.createElement('div');
            completedHeader.className = 'quest-header';
            completedHeader.textContent = 'Completed Quests:';
            questList.appendChild(completedHeader);
            
            this.completedQuests.forEach(questId => {
                const quest = this.quests[questId];
                if (quest) {
                    const questDiv = document.createElement('div');
                    questDiv.className = 'quest-item completed clickable';
                    questDiv.textContent = quest.name;
                    questDiv.onclick = () => this.showQuestDetails(questId);
                    questList.appendChild(questDiv);
                }
            });
        }
    }
    
    showQuestDetails(questId) {
        const quest = this.quests[questId];
        if (!quest) return;
        
        this.addText(`\n=== ${quest.name} ===`, 'highlight');
        this.addText(quest.description, 'info');
        this.addText(`\nObjectives:`, 'info');
        
        quest.objectives.forEach((objective, index) => {
            const isCompleted = this.isObjectiveCompleted(questId, objective);
            const status = isCompleted ? '✓' : '○';
            const statusColor = isCompleted ? 'success' : 'info';
            this.addText(`${status} ${objective}`, statusColor);
        });
        
        this.addText(`\nReward: ${quest.reward.experience} XP, ${quest.reward.caps} caps`, 'info');
        
        if (this.completedQuests.includes(questId)) {
            this.addText('Status: COMPLETED', 'success');
        } else {
            this.addText('Status: IN PROGRESS', 'info');
        }
    }
    
    isObjectiveCompleted(questId, objective) {
        // Simple objective completion tracking
        // This could be expanded with more sophisticated tracking
        switch (questId) {
            case 'firstSteps':
                if (objective === 'Visit Megaton') {
                    return this.visitedLocations.has('megaton');
                }
                if (objective === 'Talk to Lucas Simms') {
                    return this.completedQuests.includes('firstSteps') || this.hasTalkedToNPC('Lucas Simms');
                }
                break;
            case 'moiraExperiments':
                if (objective === 'Talk to Moira Brown') {
                    return this.hasTalkedToNPC('Moira Brown');
                }
                if (objective === 'Test 3 inventions') {
                    return this.completedQuests.includes('moiraExperiments');
                }
                break;
            case 'clearRaiderCamp':
                if (objective === 'Go to Raider Camp') {
                    return this.visitedLocations.has('raidercamp');
                }
                if (objective === 'Defeat all raiders') {
                    return this.completedQuests.includes('clearRaiderCamp');
                }
                break;
            case 'exploreWasteland':
                if (objective === 'Visit 5 different locations') {
                    return this.visitedLocations.size >= 5;
                }
                if (objective === 'Survive 3 combat encounters') {
                    return this.player.combatEncounters >= 3;
                }
                break;
        }
        return false;
    }
    
    hasTalkedToNPC(npcName) {
        // Simple tracking - could be expanded
        return this.player.talkedToNPCs && this.player.talkedToNPCs.includes(npcName);
    }
    
    updateTimeUI() {
        document.getElementById('gameTime').textContent = this.formatTime(this.gameTime);
    }
    
    addText(text, type = 'normal') {
        const gameText = document.getElementById('gameText');
        const textLine = document.createElement('div');
        textLine.className = `text-line ${type}`;
        textLine.textContent = text;
        gameText.appendChild(textLine);
        gameText.scrollTop = gameText.scrollHeight;
    }
    
    startGame() {
        this.gameState = 'playing';
        this.addText('Welcome to the Wasteland, Vault Dweller!', 'highlight');
        this.addText('You have emerged from Vault 101 into a dangerous world.', 'info');
        this.addText('Use your wits, skills, and whatever you can find to survive.', 'info');
        this.addText('Type "help" for available commands.', 'info');
        this.lookCommand();
        this.updateLocationUI();
    }
    
    // Game Data Initialization
    initializeLocations() {
        return {
            vault101: {
                name: 'Vault 101',
                description: 'You stand in the main corridor of Vault 101. The familiar green walls and flickering lights bring back memories of your life underground. The vault door stands closed behind you, and ahead lies the exit to the wasteland.',
                shortDescription: 'The safety of Vault 101',
                exits: [
                    { direction: 'north', location: 'vault101exit', requirement: null },
                    { direction: 'south', location: 'vault101living', requirement: null }
                ],
                items: [
                    { name: 'Vault 101 Jumpsuit', type: 'armor', weight: 2, description: 'A standard Vault-Tec jumpsuit.' },
                    { name: 'Stimpak', type: 'consumable', weight: 0.5, description: 'A healing stimulant.', effect: { type: 'heal', value: 25 } }
                ],
                npcs: [],
                enemies: []
            },
            vault101exit: {
                name: 'Vault 101 Exit',
                description: 'You stand before the massive vault door. This is the threshold between safety and the unknown wasteland beyond. The door mechanism hums quietly, ready to open at your command.',
                shortDescription: 'The threshold to the wasteland',
                exits: [
                    { direction: 'south', location: 'vault101', requirement: null },
                    { direction: 'north', location: 'wasteland', requirement: null }
                ],
                items: [],
                npcs: [],
                enemies: []
            },
            wasteland: {
                name: 'The Wasteland',
                description: 'You emerge into a desolate landscape. The sky is a sickly yellow-green, and the ground is cracked and barren. In the distance, you can see the ruins of what was once a great city. The air tastes of radiation and decay.',
                shortDescription: 'A desolate, radioactive wasteland',
                exits: [
                    { direction: 'south', location: 'vault101exit', requirement: null },
                    { direction: 'north', location: 'megaton', requirement: null },
                    { direction: 'east', location: 'raidercamp', requirement: null },
                    { direction: 'west', location: 'abandonedhouse', requirement: null }
                ],
                items: [
                    { name: 'Bottle Cap', type: 'currency', weight: 0, description: 'The currency of the wasteland.' },
                    { name: 'RadAway', type: 'consumable', weight: 1, description: 'Removes radiation.', effect: { type: 'rads', value: -25 } }
                ],
                npcs: [],
                enemies: [
                    { name: 'Radroach', hp: 15, maxHp: 15, damage: 3, experience: 10, description: 'A large, mutated cockroach.', loot: [{ name: 'Bottle Cap', type: 'currency', weight: 0, description: 'The currency of the wasteland.' }] }
                ]
            },
            megaton: {
                name: 'Megaton',
                description: 'You approach the settlement of Megaton, built around an unexploded atomic bomb. The town is a ramshackle collection of buildings and walkways, with the bomb at its center. People go about their daily business, trying to survive in this harsh world.',
                shortDescription: 'A settlement built around an atomic bomb',
                exits: [
                    { direction: 'south', location: 'wasteland', requirement: null },
                    { direction: 'north', location: 'megatonmarket', requirement: null },
                    { direction: 'east', location: 'megatoninn', requirement: null }
                ],
                items: [],
                npcs: [
                    { 
                        name: 'Lucas Simms', 
                        description: 'The sheriff of Megaton, a gruff but fair man.', 
                        dialogue: 'Welcome to Megaton, stranger. Keep your nose clean and you\'ll be fine.',
                        dialogueOptions: [
                            {
                                text: 'Tell me about Megaton',
                                response: 'Megaton\'s been here for years. We built it around that bomb - some say it\'s safe, others say it\'s a ticking time bomb. I keep the peace around here.',
                                followUp: [
                                    {
                                        text: 'Is the bomb really safe?',
                                        response: 'Been here for 200 years and hasn\'t gone off yet. But I won\'t lie - it makes some folks nervous. That\'s why we have the Church of Atom here.'
                                    },
                                    {
                                        text: 'What about the raiders?',
                                        response: 'They stay away from Megaton. We\'re well-armed and organized. Plus, we have the Brotherhood of Steel keeping an eye on things from time to time.'
                                    }
                                ]
                            },
                            {
                                text: 'Any work available?',
                                response: 'Not from me directly, but Moira over at Craterside Supply might have some odd jobs. She\'s always looking for someone to test her "experiments."',
                                effect: { type: 'offer_quest', quest: 'moiraExperiments' }
                            },
                            {
                                text: 'What\'s the law like here?',
                                response: 'Simple rules: no stealing, no murder, no causing trouble. Break the rules and you answer to me. I run a tight ship here.'
                            }
                        ]
                    },
                    { 
                        name: 'Moira Brown', 
                        description: 'A cheerful woman who runs the general store.', 
                        dialogue: 'Hello there! I\'m Moira Brown. I run Craterside Supply. Need anything?',
                        dialogueOptions: [
                            {
                                text: 'What do you sell?',
                                response: 'Oh, all sorts of things! Weapons, armor, medical supplies, food, and some of my own inventions. I also buy scrap and junk if you have any.',
                                followUp: [
                                    {
                                        text: 'What kind of inventions?',
                                        response: 'Well, I\'ve been working on some... interesting devices. Some work better than others. Would you be interested in testing some of them?',
                                        effect: { type: 'offer_quest', quest: 'moiraExperiments' }
                                    }
                                ]
                            },
                            {
                                text: 'Do you have any work?',
                                response: 'Actually, yes! I need someone to test some of my inventions. They\'re perfectly safe... mostly. I\'ll pay you 50 caps for each test!',
                                effect: { type: 'offer_quest', quest: 'moiraExperiments' }
                            },
                            {
                                text: 'Tell me about yourself',
                                response: 'I\'m a scientist and inventor! I came to Megaton because it\'s safer than the wasteland, and there\'s plenty of scrap to work with. I love creating new things!'
                            }
                        ]
                    }
                ],
                enemies: []
            },
            megatonmarket: {
                name: 'Megaton Market',
                description: 'The bustling market area of Megaton. Vendors sell their wares from makeshift stalls, and the air is filled with the sounds of haggling and the smell of cooked food.',
                shortDescription: 'The commercial heart of Megaton',
                exits: [
                    { direction: 'south', location: 'megaton', requirement: null }
                ],
                items: [
                    { name: 'Bottle Cap', type: 'currency', weight: 0, description: 'The currency of the wasteland.' },
                    { name: 'Bottle Cap', type: 'currency', weight: 0, description: 'The currency of the wasteland.' },
                    { name: 'Bottle Cap', type: 'currency', weight: 0, description: 'The currency of the wasteland.' }
                ],
                npcs: [
                    { name: 'Vendor', description: 'A merchant selling various goods.', dialogue: 'What can I get for you today?' }
                ],
                enemies: []
            },
            megatoninn: {
                name: 'Moriarty\'s Saloon',
                description: 'A dimly lit saloon filled with the sounds of conversation and the clinking of glasses. The air is thick with smoke and the smell of alcohol.',
                shortDescription: 'A rough-and-tumble saloon',
                exits: [
                    { direction: 'west', location: 'megaton', requirement: null }
                ],
                items: [],
                npcs: [
                    { 
                        name: 'Moriarty', 
                        description: 'The owner of the saloon, a shrewd businessman.', 
                        dialogue: 'Welcome to my establishment. What\'ll it be?',
                        dialogueOptions: [
                            {
                                text: 'What do you know about the wasteland?',
                                response: 'I know a lot of things, friend. Information is my business. But good information costs good money.',
                                followUp: [
                                    {
                                        text: 'What kind of information?',
                                        response: 'Trade routes, safe paths, dangerous areas, who to trust and who to avoid. I also know about some... interesting opportunities for someone with your skills.'
                                    }
                                ]
                            },
                            {
                                text: 'Any jobs available?',
                                response: 'Maybe. I hear things, and sometimes I need someone to... investigate. But first, let\'s see if you can handle yourself. Go clear out that raider camp to the east, then we\'ll talk.',
                                effect: { type: 'offer_quest', quest: 'clearRaiderCamp' }
                            },
                            {
                                text: 'Tell me about yourself',
                                response: 'I\'m a businessman. I run this saloon, I trade information, and I keep my ear to the ground. In the wasteland, knowledge is power, and power is survival.'
                            }
                        ]
                    },
                    { 
                        name: 'Gob', 
                        description: 'A friendly ghoul bartender.', 
                        dialogue: 'Hey there! What can I get you to drink?',
                        dialogueOptions: [
                            {
                                text: 'What\'s good here?',
                                response: 'We\'ve got Nuka-Cola, purified water, and some homemade brew. The Nuka-Cola\'s the real deal - pre-war stuff!',
                                followUp: [
                                    {
                                        text: 'How much for a Nuka-Cola?',
                                        response: 'That\'ll be 10 caps. It\'s worth it though - tastes just like it did before the war!'
                                    }
                                ]
                            },
                            {
                                text: 'How long have you worked here?',
                                response: 'Been here for years. Moriarty took me in when I was in a bad spot. He\'s a good boss, despite what some people say.',
                                followUp: [
                                    {
                                        text: 'What do people say about him?',
                                        response: 'Oh, you know... that he\'s ruthless, that he\'s got connections to the wrong people. But he\'s always been fair to me.'
                                    }
                                ]
                            },
                            {
                                text: 'Tell me about being a ghoul',
                                response: 'It\'s not easy, but it\'s not all bad either. The radiation doesn\'t bother me, and I\'ll live a lot longer than most humans. But some people... they don\'t like looking at me.'
                            }
                        ]
                    }
                ],
                enemies: []
            },
            raidercamp: {
                name: 'Raider Camp',
                description: 'A dangerous encampment of raiders. Makeshift shelters and warning signs mark this as hostile territory. You can see armed figures moving about.',
                shortDescription: 'A hostile raider encampment',
                exits: [
                    { direction: 'west', location: 'wasteland', requirement: null }
                ],
                items: [
                    { name: '10mm Pistol', type: 'weapon', weight: 3, damage: 15, description: 'A reliable sidearm.' },
                    { name: 'Bottle Cap', type: 'currency', weight: 0, description: 'The currency of the wasteland.' }
                ],
                npcs: [],
                enemies: [
                    { name: 'Raider', hp: 25, maxHp: 25, damage: 8, experience: 20, description: 'A violent wasteland scavenger.', loot: [{ name: 'Bottle Cap', type: 'currency', weight: 0, description: 'The currency of the wasteland.' }] }
                ]
            },
            abandonedhouse: {
                name: 'Abandoned House',
                description: 'A dilapidated house that has seen better days. The roof is partially collapsed, and the walls are covered in graffiti. It looks like it might have been looted long ago.',
                shortDescription: 'A ruined pre-war house',
                exits: [
                    { direction: 'east', location: 'wasteland', requirement: null },
                    { direction: 'down', location: 'basement', requirement: { type: 'item', item: 'Flashlight' } }
                ],
                items: [
                    { name: 'Flashlight', type: 'tool', weight: 1, description: 'A battery-powered light source.' },
                    { name: 'Bottle Cap', type: 'currency', weight: 0, description: 'The currency of the wasteland.' }
                ],
                npcs: [],
                enemies: []
            },
            basement: {
                name: 'Basement',
                description: 'A dark, damp basement filled with old furniture and boxes. The air is musty and thick with dust. You can hear the sound of something moving in the shadows.',
                shortDescription: 'A dark, mysterious basement',
                exits: [
                    { direction: 'up', location: 'abandonedhouse', requirement: null }
                ],
                items: [
                    { name: 'Pre-War Money', type: 'currency', weight: 0, description: 'Old world currency, now worthless.' },
                    { name: 'Stimpak', type: 'consumable', weight: 0.5, description: 'A healing stimulant.', effect: { type: 'heal', value: 25 } }
                ],
                npcs: [],
                enemies: [
                    { name: 'Mole Rat', hp: 20, maxHp: 20, damage: 5, experience: 15, description: 'A large, aggressive mole rat.', loot: [{ name: 'Bottle Cap', type: 'currency', weight: 0, description: 'The currency of the wasteland.' }] }
                ]
            }
        };
    }
    
    initializeNPCs() {
        return {
            lucasSimms: {
                name: 'Lucas Simms',
                description: 'The sheriff of Megaton',
                dialogue: 'Welcome to Megaton, stranger. Keep your nose clean and you\'ll be fine.',
                quest: null
            },
            moiraBrown: {
                name: 'Moira Brown',
                description: 'A cheerful woman who runs the general store',
                dialogue: 'Hello there! I\'m Moira Brown. I run Craterside Supply. Need anything?',
                quest: null
            }
        };
    }
    
    initializeItems() {
        return {
            vault101Jumpsuit: {
                name: 'Vault 101 Jumpsuit',
                type: 'armor',
                weight: 2,
                description: 'A standard Vault-Tec jumpsuit.',
                defense: 5
            },
            stimpak: {
                name: 'Stimpak',
                type: 'consumable',
                weight: 0.5,
                description: 'A healing stimulant.',
                effect: { type: 'heal', value: 25 }
            },
            radAway: {
                name: 'RadAway',
                type: 'consumable',
                weight: 1,
                description: 'Removes radiation.',
                effect: { type: 'rads', value: -25 }
            },
            bottleCap: {
                name: 'Bottle Cap',
                type: 'currency',
                weight: 0,
                description: 'The currency of the wasteland.'
            },
            mm10Pistol: {
                name: '10mm Pistol',
                type: 'weapon',
                weight: 3,
                damage: 15,
                description: 'A reliable sidearm.'
            },
            flashlight: {
                name: 'Flashlight',
                type: 'tool',
                weight: 1,
                description: 'A battery-powered light source.'
            }
        };
    }
    
    initializeQuests() {
        return {
            firstSteps: {
                id: 'firstSteps',
                name: 'First Steps',
                description: 'Explore the wasteland and find your first settlement.',
                objectives: ['Visit Megaton', 'Talk to Lucas Simms'],
                reward: { experience: 50, caps: 100 },
                completed: false
            },
            moiraExperiments: {
                id: 'moiraExperiments',
                name: 'Moira\'s Experiments',
                description: 'Test some of Moira\'s inventions for her. She promises they\'re safe... mostly.',
                objectives: ['Talk to Moira Brown', 'Test 3 inventions'],
                reward: { experience: 100, caps: 150 },
                completed: false
            },
            clearRaiderCamp: {
                id: 'clearRaiderCamp',
                name: 'Clear the Raider Camp',
                description: 'Moriarty wants you to clear out the raider camp to the east to prove your worth.',
                objectives: ['Go to Raider Camp', 'Defeat all raiders'],
                reward: { experience: 200, caps: 300 },
                completed: false
            },
            exploreWasteland: {
                id: 'exploreWasteland',
                name: 'Wasteland Explorer',
                description: 'Explore the dangerous wasteland and discover new locations.',
                objectives: ['Visit 5 different locations', 'Survive 3 combat encounters'],
                reward: { experience: 150, caps: 200 },
                completed: false
            }
        };
    }
    
    initializeEnemies() {
        return {
            radroach: {
                name: 'Radroach',
                hp: 15,
                maxHp: 15,
                damage: 3,
                experience: 10,
                description: 'A large, mutated cockroach.',
                loot: [{ name: 'Bottle Cap', type: 'currency', weight: 0, description: 'The currency of the wasteland.' }]
            },
            raider: {
                name: 'Raider',
                hp: 25,
                maxHp: 25,
                damage: 8,
                experience: 20,
                description: 'A violent wasteland scavenger.',
                loot: [{ name: 'Bottle Cap', type: 'currency', weight: 0, description: 'The currency of the wasteland.' }]
            },
            moleRat: {
                name: 'Mole Rat',
                hp: 20,
                maxHp: 20,
                damage: 5,
                experience: 15,
                description: 'A large, aggressive mole rat.',
                loot: [{ name: 'Bottle Cap', type: 'currency', weight: 0, description: 'The currency of the wasteland.' }]
            }
        };
    }
}

// Initialize the game when the page loads
let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new FalloutAdventure();
});
