import { Faker, faker as fakerOriginal } from '@faker-js/faker';


/*
 Add some functionalities to faker
 */
const faker = fakerOriginal as Faker & {
  sciper(): number
}

faker.sciper = function () { return faker.datatype.number({min: 100000, max: 999999}) }

export { faker };
