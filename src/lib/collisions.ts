/**
 * Returns `true` if `labelA` == `first` and `labelB` == `second`
 * OR  `labelA` == `second` and `labelB` == `first`
 *
 * Useful for collision matches where `labelA` and `labelB` are unordered
 */
export function eitherOr(
    labelA: string,
    labelB: string,
    first: string,
    second: string,
) {
    return (
        (labelA == first && labelB == second) ||
        (labelA == second && labelB == first)
    );
}

export enum CollisionCategories {
    categoryBoot = 0b0100,
    categoryFootball = 0b1000,
    categoryPlatform = 0b0001,
    categoryPlayer = 0b0010,
}
