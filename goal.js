const candidateId = `${process.env.CROSSMINT_KEY}`;
const baseAPIUrl = "https://challenge.crossmint.io/api";
const directions = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
const colors = ['BLUE', 'RED', 'PURPLE', 'WHITE'];
const delayBetweenRequests = 1000; // milliseconds
const retryLimit = 3; // Number of retries for each request

class AstralEntity {
    constructor(row, column, type, additionalProperties = {}) {
        this.candidateId = candidateId;
        this.row = row;
        this.column = column;
        Object.assign(this, additionalProperties);
    }
}

async function fetchGoalData() {
    const goalAPI = `${baseAPIUrl}/map/${candidateId}/goal`;
    try {
        const response = await fetch(goalAPI);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Failed to fetch goal data:', error);
        throw error;
    }
}

const myHeaders = new Headers({
    "Content-Type": "application/json"
});

function getRequestOptions(data) {
    return {
        method: 'POST',
        headers: myHeaders,
        body: JSON.stringify(data),
        redirect: 'follow'
    };
}

async function postEntity(entity, type) {
    const url = `${baseAPIUrl}/${type.toLowerCase()}s`;

    // Retry 
    for (let attempt = 1; attempt <= retryLimit; attempt++) {
        try {
            const response = await fetch(url, getRequestOptions(entity));
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json(); // Success
        } catch (error) {
            console.error(`Attempt ${attempt} failed for posting ${type}:`, error);
            if (attempt === retryLimit) throw new Error(`All retry attempts failed for posting ${type}: ${error}`);
            await new Promise(resolve => setTimeout(resolve, delayBetweenRequests)); // Wait before retrying
        }
    }
}

async function postAstralData(goal) {
    for (let i = 0; i < goal.goal.length; i++) {
        for (let j = 0; j < goal.goal[i].length; j++) {
            const text = goal.goal[i][j].split("_");
            let entity, type;

            if (text.length === 2) {
                if (colors.includes(text[0])) {
                    entity = new AstralEntity(i, j, "Soloon", { color: text[0].toLowerCase() });
                    type = "Soloon";
                } else if (directions.includes(text[0])) {
                    entity = new AstralEntity(i, j, "Cometh", { direction: text[0].toLowerCase() });
                    type = "Cometh";
                }
            } else if (text.length === 1 && text[0] === 'POLYANET') {
                entity = new AstralEntity(i, j, "Polyanet");
                type = "Polyanet";
            }

            if (entity && type) {
                try {
                    await postEntity(entity, type);
                } catch (error) {
                    console.error(`Failed to post ${type}:`, error);
                    continue; 
                }
                await new Promise(resolve => setTimeout(resolve, delayBetweenRequests));
            }
        }
    }
}

async function main() {
    try {
        const goal = await fetchGoalData();
        await postAstralData(goal);
    } catch (error) {
        console.error('Error in main process:', error);
    }
}

main();
