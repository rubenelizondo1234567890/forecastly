<?php

namespace App\DataFixtures;

use App\Entity\Frequency;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;

class FrequencyFixture extends Fixture
{
    public const MONTHLY = 'frequency_monthly';

    public function load(ObjectManager $manager): void
    {
        $monthly = new Frequency();
        $monthly->setName('Monthly');
        $monthly->setTimePeriod('month');
        $manager->persist($monthly);
        $manager->flush();

        $this->addReference(self::MONTHLY, $monthly);
    }
}
