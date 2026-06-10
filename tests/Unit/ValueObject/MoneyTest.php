<?php

namespace App\Tests\Unit\ValueObject;

use App\ValueObject\Money;
use PHPUnit\Framework\TestCase;

class MoneyTest extends TestCase
{
    public function testAddReturnsCorrectCents(): void
    {
        $a = new Money(1000); // $10.00
        $b = new Money(250);  // $2.50
        $result = $a->add($b);
        $this->assertSame(1250, $result->getAmount());
    }

    public function testSubtractReturnsCorrectCents(): void
    {
        $a = new Money(1000);
        $b = new Money(300);
        $result = $a->subtract($b);
        $this->assertSame(700, $result->getAmount());
    }

    public function testToFloatConvertsFromCents(): void
    {
        $money = new Money(199);
        $this->assertSame(1.99, $money->toFloat());
    }

    public function testFromFloatConvertsToIntegerCents(): void
    {
        $money = Money::fromFloat(19.99);
        $this->assertSame(1999, $money->getAmount());
    }

    public function testFormattedHookReturnsUsdString(): void
    {
        $money = new Money(4200);
        $this->assertSame('$42.00', $money->formatted);
    }

    public function testAddThrowsOnCurrencyMismatch(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        (new Money(100, 'USD'))->add(new Money(100, 'EUR'));
    }
}
