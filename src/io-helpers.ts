import Table from 'cli-table';
import chalk from 'chalk';

const { bold, greenBright, white } = chalk;

export const showGreetings = () => {
    console.log(`Starting ${bold('quick-cov')}...`);
    console.log(`Developed at ${bold('Rethink Tecnologia')} headquarters.`);
    console.log(`Join us ~ ${greenBright(bold('rethink.dev/carreiras'))}\n`);
};

export const showTable = async (keys: string[], rows: string[][]) => {
    const table = new Table({
        head: keys.map((key) => white(bold(key))),
    });

    rows.forEach((row) => {
        table.push(row);
    });

    console.log(table.toString());
};
