<?php

namespace App\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'frequencies')]
class Frequency
{
    /**
     * @var int
     */
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(name: 'id', type: Types::INTEGER)]
    private int $id;
    
    /**
     * @var string
     */
    #[ORM\Column(name: 'name', type: Types::STRING, length: 45)]
    private string $name;
    
    /**
     * @var string
     */
    #[ORM\Column(name: 'time_period', type: Types::STRING, length: 45)]
    private string $timePeriod;
    
    /**
     * @return int
     */
    public function getId(): int
    {
        return $this->id;
    }
    
    /**
     * @return string
     */
    public function getName(): string
    {
        return $this->name;
    }
    
    /**
     * @param string $name
     * @return Frequency
     */
    public function setName(string $name): Frequency
    {
        $this->name = $name;
        return $this;
    }
    
    /**
     * @return string
     */
    public function getTimePeriod(): string
    {
        return $this->timePeriod;
    }
    
    /**
     * @param string $timePeriod
     * @return Frequency
     */
    public function setTimePeriod(string $timePeriod): Frequency
    {
        $this->timePeriod = $timePeriod;
        return $this;
    }
    
}