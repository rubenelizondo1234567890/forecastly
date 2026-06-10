<?php

namespace App\Entity;

use DateTimeInterface;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'log')]
class Log
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
    #[ORM\Column(name: 'affected_entity_name', type: Types::STRING, length: 45)]
    private string $affectedEntityName;
    
    /**
     * @var string
     */
    #[ORM\Column(name: 'action', type: Types::STRING, length: 45)]
    private string $action;
    
    /**
     * @var string
     */
    #[ORM\Column(name: 'log_entity_data', type: Types::TEXT, length: 0)]
    private string $logEntityData;
    
    #[ORM\Column(name: 'log_timestamp', type: 'datetime')]
    private DateTimeInterface $logTimestamp;
    
    /**
     * @var Customer
     */
    #[ORM\ManyToOne(targetEntity: Customer::class)]
    #[ORM\JoinColumn(name: 'customer_id', referencedColumnName: 'id')]
    private Customer $customer;
    
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
    public function getAffectedEntityName(): string
    {
        return $this->affectedEntityName;
    }
    
    /**
     * @param string $affectedEntityName
     * @return Log
     */
    public function setAffectedEntityName(string $affectedEntityName): Log
    {
        $this->affectedEntityName = $affectedEntityName;
        return $this;
    }
    
    /**
     * @return string
     */
    public function getAction(): string
    {
        return $this->action;
    }
    
    /**
     * @param string $action
     * @return Log
     */
    public function setAction(string $action): Log
    {
        $this->action = $action;
        return $this;
    }
    
    /**
     * @return string
     */
    public function getLogEntityData(): string
    {
        return $this->logEntityData;
    }
    
    /**
     * @param string $logEntityData
     * @return Log
     */
    public function setLogEntityData(string $logEntityData): Log
    {
        $this->logEntityData = $logEntityData;
        return $this;
    }
    
    /**
     * @return DateTimeInterface
     */
    public function getLogTimestamp(): DateTimeInterface
    {
        return $this->logTimestamp;
    }
    
    /**
     * @param DateTimeInterface $logTimestamp
     * @return Log
     */
    public function setLogTimestamp(DateTimeInterface $logTimestamp): Log
    {
        $this->logTimestamp = $logTimestamp;
        return $this;
    }
    
    /**
     * @return Customer
     */
    public function getCustomer(): Customer
    {
        return $this->customer;
    }
    
    /**
     * @param Customer $customer
     * @return Log
     */
    public function setCustomer(Customer $customer): Log
    {
        $this->customer = $customer;
        return $this;
    }
    
}